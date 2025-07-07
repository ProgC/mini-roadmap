Mini-Roadmap Web App
A roadmap web application inspired by Unreal Engine's road map web service, built with a Node.js (Express) backend and a static-file-based frontend.

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

📝 License
This project is distributed under the MIT License.
