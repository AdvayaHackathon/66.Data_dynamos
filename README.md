# Hospital Resource Management System

A web-based system that allows hospitals to share and request medical resources based on availability and proximity.

## Features

- **Register Resources**: Hospitals can register their available medical resources
- **Search Resources**: Find available resources from other hospitals
- **Request Resources**: Request needed resources from other hospitals
- **Proximity-Based Results**: Find resources sorted by distance and availability
- **Resource Management**: View and manage your hospital's registered resources

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB

## Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v12 or higher)
- MongoDB (local installation or MongoDB Atlas account)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/hospital-management-system.git
   cd hospital-management-system
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the project root and add the following:
   ```
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/hospitalResourceDB
   ```
   Note: Replace the MongoDB URI with your own connection string if using MongoDB Atlas.

## Running the Application

1. Start the server:
   ```
   npm start
   ```

2. Access the application at:
   ```
   http://localhost:3001
   ```

## API Endpoints

### Resources

- `POST /api/resources` - Register a new resource
- `POST /api/resources/search` - Search for resources with filters
- `GET /api/hospitals/resources?hospitalName=xyz` - Get resources for a specific hospital
- `POST /api/resources/request` - Request a resource from another hospital
- `DELETE /api/resources/:id` - Delete a resource

## Project Structure

```
hospital-management-system/
├── public/
│   ├── assets/          # SVG icons and images
│   ├── css/             # CSS stylesheets
│   ├── js/              # JavaScript files
│   ├── index.html       # Home page
│   ├── register.html    # Register resources page
│   └── search.html      # Search resources page
├── server.js            # Express server and API endpoints
├── .env                 # Environment variables
├── package.json         # Project dependencies
└── README.md            # This file
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Icons provided by FontAwesome
- UI design inspired by modern healthcare systems 