const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'public')));

// 이미지 업로드 설정
const uploadDir = path.join(__dirname, 'public', 'uploads');
const tagImageDir = path.join(__dirname, 'public', 'tagImages');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(tagImageDir)) {
  fs.mkdirSync(tagImageDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const tagImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tagImageDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });
const uploadTagImage = multer({ storage: tagImageStorage });

const dbPath = path.join(__dirname, 'roadmap.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    thumbnail TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    heartCount INTEGER DEFAULT 0
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    itemId INTEGER NOT NULL,
    author TEXT,
    content TEXT NOT NULL,
    createdAt TEXT,
    FOREIGN KEY(itemId) REFERENCES items(id) ON DELETE CASCADE
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS items_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    itemId INTEGER,
    title TEXT,
    description TEXT,
    status TEXT,
    category TEXT,
    priority TEXT,
    progress INTEGER,
    thumbnail TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    heartCount INTEGER,
    backupType TEXT,
    backupAt TEXT
  )`);
  
  // tags 테이블 생성
  db.run(`CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    image TEXT,
    color TEXT NOT NULL DEFAULT '#666666',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // item_tags 테이블 생성 (다대다 관계)
  db.run(`CREATE TABLE IF NOT EXISTS item_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    itemId INTEGER NOT NULL,
    tagId INTEGER NOT NULL,
    FOREIGN KEY (itemId) REFERENCES items (id) ON DELETE CASCADE,
    FOREIGN KEY (tagId) REFERENCES tags (id) ON DELETE CASCADE,
    UNIQUE(itemId, tagId)
  )`);
});

// 아이템 백업 함수 (최대 50개 유지)
function backupItem(item, backupType = 'update') {
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO items_history (itemId, title, description, status, category, priority, progress, thumbnail, createdAt, updatedAt, heartCount, backupType, backupAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [item.id, item.title, item.description, item.status, item.category, item.priority, item.progress, item.thumbnail, item.createdAt, item.updatedAt, item.heartCount, backupType, now],
    function () {
      // 50개 초과 시 오래된 것 삭제
      db.all('SELECT id FROM items_history WHERE itemId = ? ORDER BY backupAt DESC', [item.id], (err, rows) => {
        if (rows && rows.length > 50) {
          const toDelete = rows.slice(50).map(r => r.id);
          if (toDelete.length > 0) {
            db.run(`DELETE FROM items_history WHERE id IN (${toDelete.map(() => '?').join(',')})`, toDelete);
          }
        }
      });
    }
  );
}

// 로드맵 데이터 조회 API (SQLite 기반)
app.get('/api/roadmap', (req, res) => {
  db.all('SELECT * FROM items', (err, items) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    db.all('SELECT name FROM categories', (err, categories) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      db.all('SELECT * FROM tags', (err, tags) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        
        // 각 아이템에 태그 정보 추가
        const itemsWithTags = items.map(item => {
          return new Promise((resolve) => {
            db.all(
              `SELECT t.* FROM tags t 
               INNER JOIN item_tags it ON t.id = it.tagId 
               WHERE it.itemId = ?`,
              [item.id],
              (err, itemTags) => {
                resolve({ ...item, tags: itemTags || [] });
              }
            );
          });
        });
        
        Promise.all(itemsWithTags).then(itemsWithTagsData => {
          res.json({
            title: "TNT",
            description: "Roadmap",
            tabs: [{ id: "124", name: "TNT", active: true }],
            items: itemsWithTagsData,
            filters: {
              status: ["All", "Planning", "In Progress", "Completed"],
              category: ["All", ...categories.map(c => c.name)],
              priority: ["All", "High", "Medium", "Low"]
            },
            tags: tags
          });
        });
      });
    });
  });
});

// 새로운 컨텐츠 등록 API (SQLite 기반)
app.post('/api/roadmap/items', upload.single('thumbnail'), (req, res) => {
  const { title, description, status, category, priority, progress } = req.body;
  let thumbnail = null;
  if (req.file) {
    thumbnail = '/uploads/' + req.file.filename;
  }
  if (!title || !description || !status || !category || !priority) {
    return res.status(400).json({ error: 'Required fields are missing.' });
  }
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO items (title, description, status, category, priority, progress, thumbnail, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description, status, category, priority, progress || 0, thumbnail, now, now],
    function (err) {
      if (err) return res.status(500).json({ error: 'DB error' });
      db.get('SELECT * FROM items WHERE id = ?', [this.lastID], (err, item) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        res.status(201).json(item);
      });
    }
  );
});

// 컨텐츠 수정 API (SQLite 기반)
app.put('/api/roadmap/items/:id', upload.single('thumbnail'), (req, res) => {
  const itemId = parseInt(req.params.id);
  const { title, description, status, category, priority, progress } = req.body;
  let thumbnail = null;
  if (req.file) {
    thumbnail = '/uploads/' + req.file.filename;
  }
  db.get('SELECT * FROM items WHERE id = ?', [itemId], (err, oldItem) => {
    if (err || !oldItem) return res.status(404).json({ error: 'Item not found.' });
    backupItem(oldItem, 'update');
    db.run(
      `UPDATE items SET title=?, description=?, status=?, category=?, priority=?, progress=?, thumbnail=?, updatedAt=? WHERE id=?`,
      [
        title || oldItem.title,
        description || oldItem.description,
        status || oldItem.status,
        category || oldItem.category,
        priority || oldItem.priority,
        progress !== undefined ? progress : oldItem.progress,
        thumbnail || oldItem.thumbnail,
        new Date().toISOString(),
        itemId
      ],
      function (err) {
        if (err) return res.status(500).json({ error: 'DB error' });
        db.get('SELECT * FROM items WHERE id = ?', [itemId], (err, item) => {
          if (err) return res.status(500).json({ error: 'DB error' });
          res.json(item);
        });
      }
    );
  });
});

// 컨텐츠 삭제 API (SQLite 기반)
app.delete('/api/roadmap/items/:id', (req, res) => {
  const itemId = parseInt(req.params.id);
  db.get('SELECT * FROM items WHERE id = ?', [itemId], (err, item) => {
    if (item) backupItem(item, 'delete');
    db.run('DELETE FROM items WHERE id = ?', [itemId], function (err) {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ message: 'Item deleted successfully.' });
    });
  });
});

// 카테고리 추가 API (SQLite 기반)
app.post('/api/roadmap/categories', (req, res) => {
  const { category } = req.body;
  if (!category) {
    return res.status(400).json({ error: 'Category name is required.' });
  }
  db.run('INSERT OR IGNORE INTO categories (name) VALUES (?)', [category], function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.status(201).json({ category });
  });
});

// 카테고리 삭제 API
app.delete('/api/roadmap/categories/:category', (req, res) => {
  const category = req.params.category;
  if (!category) return res.status(400).json({ error: 'Category is required.' });
  db.serialize(() => {
    db.run('DELETE FROM categories WHERE name = ?', [category], function (err) {
      if (err) return res.status(500).json({ error: 'DB error' });
      db.run('UPDATE items SET category = ? WHERE category = ?', ['Uncategorized', category], function (err2) {
        if (err2) return res.status(500).json({ error: 'DB error' });
        res.json({ message: 'Category deleted and items updated.' });
      });
    });
  });
});

// 하트 증가 API
app.post('/api/roadmap/items/:id/heart', (req, res) => {
  const itemId = parseInt(req.params.id);
  db.run('UPDATE items SET heartCount = heartCount + 1 WHERE id = ?', [itemId], function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    db.get('SELECT heartCount FROM items WHERE id = ?', [itemId], (err, row) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ heartCount: row.heartCount });
    });
  });
});

// 댓글 목록 조회
app.get('/api/roadmap/items/:id/comments', (req, res) => {
  const itemId = parseInt(req.params.id);
  db.all('SELECT * FROM comments WHERE itemId = ? ORDER BY createdAt ASC', [itemId], (err, comments) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(comments);
  });
});
// 댓글 추가
app.post('/api/roadmap/items/:id/comments', (req, res) => {
  const itemId = parseInt(req.params.id);
  const { author, content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required.' });
  const now = new Date().toISOString();
  db.run(
    'INSERT INTO comments (itemId, author, content, createdAt) VALUES (?, ?, ?, ?)',
    [itemId, author || 'Anonymous', content, now],
    function (err) {
      if (err) return res.status(500).json({ error: 'DB error' });
      db.get('SELECT * FROM comments WHERE id = ?', [this.lastID], (err, comment) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        res.status(201).json(comment);
      });
    }
  );
});
// 댓글 삭제
app.delete('/api/roadmap/items/:itemId/comments/:commentId', (req, res) => {
  const commentId = parseInt(req.params.commentId);
  db.run('DELETE FROM comments WHERE id = ?', [commentId], function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ message: 'Comment deleted.' });
  });
});

// 아이템 이력 조회 API
app.get('/api/roadmap/items/:id/history', (req, res) => {
  const itemId = parseInt(req.params.id);
  db.all('SELECT * FROM items_history WHERE itemId = ? ORDER BY backupAt DESC', [itemId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
});
// 특정 이력으로 복구 API
app.post('/api/roadmap/items/:id/restore/:historyId', (req, res) => {
  const itemId = parseInt(req.params.id);
  const historyId = parseInt(req.params.historyId);
  db.get('SELECT * FROM items_history WHERE id = ?', [historyId], (err, hist) => {
    if (err || !hist) return res.status(404).json({ error: 'History not found.' });
    db.run(
      `UPDATE items SET title=?, description=?, status=?, category=?, priority=?, progress=?, thumbnail=?, updatedAt=?, heartCount=? WHERE id=?`,
      [
        hist.title,
        hist.description,
        hist.status,
        hist.category,
        hist.priority,
        hist.progress,
        hist.thumbnail,
        new Date().toISOString(),
        hist.heartCount,
        itemId
      ],
      function (err) {
        if (err) return res.status(500).json({ error: 'DB error' });
        db.get('SELECT * FROM items WHERE id = ?', [itemId], (err, item) => {
          if (err) return res.status(500).json({ error: 'DB error' });
          res.json(item);
        });
      }
    );
  });
});

// 태그 목록 조회 API
app.get('/api/roadmap/tags', (req, res) => {
  db.all('SELECT * FROM tags ORDER BY name', (err, tags) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(tags);
  });
});

// 태그 추가 API
app.post('/api/roadmap/tags', uploadTagImage.single('image'), (req, res) => {
  const { name, icon, color } = req.body;
  let image = null;
  if (req.file) {
    image = '/tagImages/' + req.file.filename;
  }
  if (!name || (!icon && !image)) {
    return res.status(400).json({ error: 'Name and either icon or image are required.' });
  }
  db.run(
    'INSERT INTO tags (name, icon, image, color) VALUES (?, ?, ?, ?)',
    [name, icon || null, image, color || '#666666'],
    function (err) {
      if (err) return res.status(500).json({ error: 'DB error' });
      db.get('SELECT * FROM tags WHERE id = ?', [this.lastID], (err, tag) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        res.status(201).json(tag);
      });
    }
  );
});

// 태그 삭제 API
app.delete('/api/roadmap/tags/:id', (req, res) => {
  const tagId = parseInt(req.params.id);
  db.run('DELETE FROM tags WHERE id = ?', [tagId], function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ message: 'Tag deleted successfully.' });
  });
});

// 아이템에 태그 추가 API
app.post('/api/roadmap/items/:id/tags', (req, res) => {
  const itemId = parseInt(req.params.id);
  const { tagId } = req.body;
  if (!tagId) {
    return res.status(400).json({ error: 'Tag ID is required.' });
  }
  db.run(
    'INSERT INTO item_tags (itemId, tagId) VALUES (?, ?)',
    [itemId, tagId],
    function (err) {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ message: 'Tag added to item successfully.' });
    }
  );
});

// 아이템에서 태그 제거 API
app.delete('/api/roadmap/items/:id/tags/:tagId', (req, res) => {
  const itemId = parseInt(req.params.id);
  const tagId = parseInt(req.params.tagId);
  db.run(
    'DELETE FROM item_tags WHERE itemId = ? AND tagId = ?',
    [itemId, tagId],
    function (err) {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ message: 'Tag removed from item successfully.' });
    }
  );
});

// 아이템의 태그 목록 조회 API
app.get('/api/roadmap/items/:id/tags', (req, res) => {
  const itemId = parseInt(req.params.id);
  db.all(
    `SELECT t.* FROM tags t 
     INNER JOIN item_tags it ON t.id = it.tagId 
     WHERE it.itemId = ?`,
    [itemId],
    (err, tags) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json(tags);
    }
  );
});

// 메인 페이지
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 관리자 페이지
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to view the roadmap`);
  console.log(`Visit http://localhost:${PORT}/admin to manage content`);
}); 