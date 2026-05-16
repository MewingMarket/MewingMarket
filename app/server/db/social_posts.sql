CREATE TABLE IF NOT EXISTS social_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  piattaforma VARCHAR(50) NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- video, reel, foto, testo
  testo LONGTEXT,
  link VARCHAR(500),
  data_pubblicazione DATETIME,
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  share_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
