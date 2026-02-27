SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE USERS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lastname VARCHAR(255),
    firstname VARCHAR(255),
    birthdate TIMESTAMP,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    phone BIGINT,
    country VARCHAR(255),
    address VARCHAR(255),
    city VARCHAR(255),
    postcode INT,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN,
    role VARCHAR(50)
);

CREATE TABLE AGENCIES (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    country VARCHAR(255),
    address VARCHAR(255),
    postcode INT,
    phone BIGINT,
    is_active BOOLEAN
);

CREATE TABLE VEHICLES (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT,
    brand VARCHAR(255),
    model VARCHAR(255),
    category VARCHAR(255),
    type VARCHAR(255),
    transmission VARCHAR(50),
    fuel VARCHAR(50),
    availability BOOLEAN,
    FOREIGN KEY (agency_id) REFERENCES AGENCIES(id) ON DELETE SET NULL
);

CREATE TABLE TICKETS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    topic VARCHAR(255),
    status VARCHAR(50),
    agent_id INT,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_edit_date TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    solved_date TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES USERS(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES USERS(id) ON DELETE SET NULL
);

CREATE TABLE MESSAGES (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT,
    sender_id INT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    content VARCHAR(1000), 
    FOREIGN KEY (ticket_id) REFERENCES TICKETS(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES USERS(id) ON DELETE CASCADE
);

CREATE TABLE PAYMENTS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT,
    stripe_invoice_id INT,
    sum INT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reservation_id) REFERENCES RESERVATIONS(id) ON DELETE CASCADE
);

CREATE TABLE RESERVATIONS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    departure_agency_id INT,
    return_agency_id INT,
    vehicle_id INT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    status VARCHAR(50),
    price INT,
    payment_id INT,
    FOREIGN KEY (user_id) REFERENCES USERS(id) ON DELETE CASCADE,
    FOREIGN KEY (departure_agency_id) REFERENCES AGENCIES(id) ON DELETE SET NULL,
    FOREIGN KEY (return_agency_id) REFERENCES AGENCIES(id) ON DELETE SET NULL,
    FOREIGN KEY (vehicle_id) REFERENCES VEHICLES(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_id) REFERENCES PAYMENTS(id) ON DELETE SET NULL
);

SET FOREIGN_KEY_CHECKS = 1;