Mini-Roadmap Web App

A roadmap web application inspired by ProductBoard, built with a Node.js (Express) backend and a static-file-based frontend.
🚀 Key Features
1. Roadmap Card System
- Card-based content display: Shows title, description, status, category, priority, and progress
- Thumbnail image support: Upload and display images for each card
- Filtering system: Filter by status, category, or priority
- Responsive design: Fully optimized for mobile and desktop
2. Interaction Features
- Heart (♥) functionality: Like cards, with real-time sync of count
- Comment system: Write and view comments for each card
- Detail modal: Click a card to view full content, comments, hearts, and progress in a popup
- Progress indicator: Visual progress bar to display status
3. Admin Features
- Content management: Add/edit/delete roadmap items
- Category management: Add/delete categories (deleted items default to “Uncategorized”)
- Image uploads: Handle thumbnail uploads with multer
- Revision history: View and restore edited/deleted items
4. Data Management
- SQLite database: Persistent data storage
- Backup history: Stores up to 50 change records in items_history table
- Real-time sync: Live update for hearts, comments, etc.
🛠 Tech Stack
Backend
- Node.js + Express: Server framework
- SQLite: Database
- multer: File upload middleware
- CORS: Cross-origin request handling
Frontend
- Vanilla JavaScript: Pure JS implementation
- CSS3: Responsive layout and animations
- HTML5: Semantic markup
📁 Project Structure
card-content-app/
├── backend/
│   ├── index.js              # Main server file
│   ├── package.json          # Dependencies
│   ├── public/               # Static files
│   │   ├── index.html        # Main page
│   │   ├── roadmap.js        # Roadmap logic
│   │   ├── roadmap.css       # Roadmap styling
│   │   ├── admin.html        # Admin page
│   │   ├── admin.js          # Admin features
│   │   ├── admin.css         # Admin styling
│   │   └── styles.css        # Common styles
│   └── uploads/              # Image storage
└── README.md                 # Project documentation


🗄 Database Schema
items table
- id: Unique ID
- title: Title
- description: Description
- status: Status (Planning, In Progress, Completed, On Hold)
- category: Category
- priority: Priority (Low, Medium, High, Critical)
- progress: Progress (0–100%)
- thumbnail: Image path
- heartCount: Number of hearts
- createdAt: Creation date
- updatedAt: Update date
categories table
- id: Unique ID
- name: Category name
comments table
- id: Unique ID
- itemId: Related item ID
- author: Author name
- content: Comment content
- createdAt: Comment date
items_history table
- id: Unique ID
- itemId: Related item ID
- backupType: Backup type (UPDATE, DELETE)
- backupAt: Backup timestamp
- Other item fields (state at time of backup)
🚀 How to Run
- Install dependencies
cd backend
npm install


- Start the server
npm start


- Access the app
- Main page: http://localhost:3000
- Admin page: http://localhost:3000/admin
📋 Development Stages
Stage 1: Basic Setup
- Express server configuration
- Static file serving
- Basic HTML/CSS structure
Stage 2: Static Content
- Display cards using hardcoded roadmap data
- Filtering functionality
Stage 3: Dynamic Content Management
- Admin page implementation
- CRUD API development
- Image upload functionality
Stage 4: Interaction Features
- Heart functionality
- Comment system
- Detail modal implementation
Stage 5: Persistent Data
- Introduced SQLite database
- Transitioned from memory-based to DB-based architecture
Stage 6: Advanced Features
- Category management
- History management system
- Improved real-time synchronization
🎨 UI/UX Highlights
Main Page
- Card layout: Clean grid-based card arrangement
- Filter bar: Filter options positioned at the top
- Responsive layout: Optimized for mobile devices
Detail Modal
- Full content view: See all information at once
- Comment section: Scrollable comments area
- Heart functionality: Can like items inside modal
- Close restriction: Can only be closed via “X” button to prevent mistakes
Admin Page
- Intuitive forms: User-friendly forms for adding/editing items
- History management: View and restore revision history per item
- Category management: Add/delete categories
🔧 Key API Endpoints
Content Management
- GET /api/roadmap – Get all roadmap data
- POST /api/roadmap/items – Add new item
- PUT /api/roadmap/items/:id – Edit item
- DELETE /api/roadmap/items/:id – Delete item
Interaction
- POST /api/roadmap/items/:id/heart – Add heart
- GET /api/roadmap/items/:id/comments – Get comments
- POST /api/roadmap/items/:id/comments – Add comment
Category Management
- POST /api/roadmap/categories – Add category
- DELETE /api/roadmap/categories/:name – Delete category
History Management
- GET /api/roadmap/items/:id/history – View item history
- POST /api/roadmap/items/:id/restore/:historyId – Restore to specific version

📝 License
This project is distributed under the MIT License.
