const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection state
let mongoConnected = false;

// Resource Schema & Model
const resourceSchema = new mongoose.Schema({
  hospitalName: { type: String, required: true },
  hospitalAddress: { type: String, required: true },
  resourceType: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  createdAt: { type: Date, default: Date.now },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  }
});

// Create index for geospatial queries
resourceSchema.index({ location: '2dsphere' });

const Resource = mongoose.model('Resource', resourceSchema);

// Connect to MongoDB
const connectToMongoDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hospitalResourceDB';
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('Connected to MongoDB successfully');
    mongoConnected = true;
    return true;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    return false;
  }
};

// Middleware to check MongoDB connection
const checkMongoConnection = (req, res, next) => {
  if (!mongoConnected) {
    return res.status(503).json({ 
      success: false, 
      error: 'Database connection unavailable. Please try again later.' 
    });
  }
  next();
};

// Helper function to get resource name from resource type
function getResourceName(resourceType) {
  const resourceTypeMap = {
    // Antibiotics
    'antibiotics_amoxicillin': 'Amoxicillin',
    'antibiotics_azithromycin': 'Azithromycin',
    'antibiotics_ciprofloxacin': 'Ciprofloxacin',
    'antibiotics_penicillin': 'Penicillin',
    'antibiotics_cephalexin': 'Cephalexin',
    
    // Analgesics
    'analgesics_paracetamol': 'Paracetamol/Acetaminophen',
    'analgesics_ibuprofen': 'Ibuprofen',
    'analgesics_naproxen': 'Naproxen',
    'analgesics_aspirin': 'Aspirin',
    'analgesics_codeine': 'Codeine',
    'analgesics_morphine': 'Morphine',
    
    // Antivirals
    'antivirals_oseltamivir': 'Oseltamivir (Tamiflu)',
    'antivirals_acyclovir': 'Acyclovir',
    'antivirals_lopinavir': 'Lopinavir/Ritonavir',
    
    // COVID Vaccines
    'covid_vaccines_pfizer': 'Pfizer-BioNTech COVID-19 Vaccine',
    'covid_vaccines_moderna': 'Moderna COVID-19 Vaccine',
    'covid_vaccines_astrazeneca': 'AstraZeneca COVID-19 Vaccine',
    'covid_vaccines_jj': 'Johnson & Johnson COVID-19 Vaccine',
    
    // Equipment examples
    'ventilators_icu': 'ICU Ventilator',
    'ventilators_transport': 'Transport Ventilator',
    'ppe_masks_n95': 'N95 Respirator Masks',
    'ppe_masks_surgical': 'Surgical Masks'
  };

  // If we have a specific mapping, use it
  if (resourceTypeMap[resourceType]) {
    return resourceTypeMap[resourceType];
  }

  // Otherwise, fall back to a generic approach
  const parts = resourceType.split('_');
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1];
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1).replace(/-/g, ' ');
  }
  
  return resourceType;
}

// Define API routes
// Add a new resource
app.post('/api/resources', checkMongoConnection, async (req, res) => {
  try {
    const resourceData = req.body;
    
    const resource = new Resource({
      ...resourceData,
      location: {
        type: 'Point',
        coordinates: [0, 0] // Placeholder coordinates
      }
    });
    
    await resource.save();
    res.status(201).json({ success: true, resource });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Search resources
app.post('/api/resources/search', checkMongoConnection, async (req, res) => {
  try {
    const { query } = req.query;
    const { resourceTypes } = req.body;
    
    // Build MongoDB query
    let dbQuery = {};
    
    // Apply resource type filters if any are selected
    if (resourceTypes && resourceTypes.length > 0) {
      dbQuery.resourceType = { $in: resourceTypes };
    }
    
    // Apply search query if provided
    if (query) {
      dbQuery.$or = [
        { resourceType: { $regex: query, $options: 'i' } },
        { hospitalName: { $regex: query, $options: 'i' } }
      ];
    }
    
    // Find resources
    const resources = await Resource.find(dbQuery).sort({ createdAt: -1 });
    
    // Process resources to add resource name and distance information
    const processedResources = resources.map(resource => {
      const resourceObj = resource.toObject();
      
      // Add derived resource name based on the resource type
      resourceObj.resourceName = getResourceName(resourceObj.resourceType);
      
      // In a real application, this would calculate actual distance
      // based on geolocation coordinates between the user and the resource
      resourceObj.distance = Math.random() * 10; // Random distance between 0-10 km
      
      return resourceObj;
    });
    
    // Sort by distance
    processedResources.sort((a, b) => a.distance - b.distance);
    
    res.json({ success: true, resources: processedResources });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get resources by hospital name
app.get('/api/hospitals/resources', checkMongoConnection, async (req, res) => {
  try {
    const { hospitalName } = req.query;
    
    if (!hospitalName) {
      return res.status(400).json({ success: false, error: 'Hospital name is required' });
    }
    
    // Find resources for this hospital
    const resources = await Resource.find({ 
      hospitalName: { $regex: new RegExp(hospitalName, 'i') } 
    }).sort({ createdAt: -1 });
    
    // Process resources to add resource name
    const processedResources = resources.map(resource => {
      const resourceObj = resource.toObject();
      resourceObj.resourceName = getResourceName(resourceObj.resourceType);
      
      // Add formatted date
      resourceObj.formattedDate = new Date(resourceObj.createdAt).toLocaleDateString();
      
      return resourceObj;
    });
    
    res.json({ 
      success: true, 
      resources: processedResources,
      total: processedResources.length
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Request a resource
app.post('/api/resources/request', checkMongoConnection, async (req, res) => {
  try {
    const { resourceId, requestingHospital, quantity } = req.body;
    
    // Find the resource
    const resource = await Resource.findById(resourceId);
    
    if (!resource) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }
    
    if (resource.quantity < quantity) {
      return res.status(400).json({ success: false, error: 'Requested quantity exceeds available quantity' });
    }
    
    // Update the resource quantity
    resource.quantity -= quantity;
    await resource.save();
    
    res.json({ success: true, message: 'Resource requested successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete a resource
app.delete('/api/resources/:id', checkMongoConnection, async (req, res) => {
  try {
    const resourceId = req.params.id;
    
    if (!resourceId) {
      return res.status(400).json({ success: false, error: 'Resource ID is required' });
    }
    
    // Find and delete the resource
    const result = await Resource.findByIdAndDelete(resourceId);
    
    if (!result) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }
    
    res.json({ success: true, message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// HTML Routes - Serve static pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/search', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'search.html'));
});

// Connect to MongoDB and start the server
const startServer = async () => {
  const connected = await connectToMongoDB();
  
  const server = app.listen(PORT, () => {
    console.log(`
========================================
  Hospital Resource Management System
========================================
  Server running on port ${PORT}
  Access the application at: http://localhost:${PORT}
  Database connection: ${mongoConnected ? 'Connected' : 'Not Connected'}
========================================
  `);
  });

  // Handle server shutdown gracefully
  process.on('SIGINT', () => {
    console.log('Shutting down server...');
    server.close(() => {
      console.log('Server stopped');
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    });
  });
};

// Start the server
startServer(); 