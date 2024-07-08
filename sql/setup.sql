create database event_management;
use event_management;
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- SELECT * FROM users
-- WHERE id = 'bikash';

-- SELECT * FROM users;
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    datetime DATETIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    tickets VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
SELECT * FROM events;
-- CREATE TABLE ticket_bookings (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     name VARCHAR(255) NOT NULL,
--     email VARCHAR(255) NOT NULL,
--     phoneNo VARCHAR(20) NOT NULL,
--     no_of_tickets INT NOT NULL,
--     event_id INT NOT NULL,
--     FOREIGN KEY (email) REFERENCES users(email),
--     FOREIGN KEY (event_id) REFERENCES events(id)
-- );
-- SELECT * FROM ticket_bookings;	
-- SELECT * from events 
-- where id = "8";

ALTER TABLE events
CHANGE COLUMN id event_id INT;

ALTER TABLE ticket_bookings
CHANGE COLUMN phoneNo phoneNo BIGINT,
ADD CONSTRAINT phoneNo_check CHECK (LENGTH(phoneNo) = 10);

-- DELETE FROM ticket_bookings
-- WHERE name = 'tinku';

-- DELETE FROM ticket_bookings WHERE name = 'tinku' LIMIT 1;

ALTER TABLE ticket_bookings DROP FOREIGN KEY fk_ticket_bookings_users;
DROP TABLE ticket_bookings;

CREATE TABLE ticket_bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phoneNo VARCHAR(20) NOT NULL,
    no_of_tickets INT NOT NULL,
    event_id INT NOT NULL
);
ALTER TABLE ticket_bookings ADD COLUMN ticket_type VARCHAR(50);
ALTER TABLE ticket_bookings ADD COLUMN payment_method VARCHAR(50);

CREATE TABLE organizer (
    id INT AUTO_INCREMENT PRIMARY KEY
);
INSERT INTO organizer (id) VALUES (100);
INSERT INTO organizer (id) VALUES (101);
INSERT INTO organizer (id) VALUES (102);
INSERT INTO organizer (id) VALUES (103);
INSERT INTO organizer (id) VALUES (104);
INSERT INTO organizer (id) VALUES (105);

-- select * from organizer;

CREATE TABLE organization (
    organization_id INT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- select * from organization;