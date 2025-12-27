const { Client } = require('pg');
const bcrypt = require('bcrypt');
const saltNumber = 10;

require('dotenv').config();

// Client connection
var client = new Client({
    host: 'localhost',
    user: 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'postgres',
    port: process.env.DB_PORT,
});

client.connect();

// Helper Functions -----------------------------------------------------------

function createTables() {
    // Users table
    client.query(
        `
        CREATE TABLE IF NOT EXISTS Users (
            userid SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            forename VARCHAR(255) NOT NULL,
            surname VARCHAR(255) NOT NULL,
            hashed_password TEXT NOT NULL,
            salt TEXT NOT NULL
        );`, 
        (err, res) => {
            if (err) {
                console.error('Error recreating Users table:', err);
                return;
            }
            console.log('Users table recreated successfully');
        }
    );
    
    // Posts table
    client.query(
        `
        CREATE TABLE IF NOT EXISTS Posts (
            postid SERIAL PRIMARY KEY,
            userid INT REFERENCES Users(userid) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            image BYTEA,
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`, 
        (err, res) => {
            if (err) {
                console.error('Error creating Posts table:', err);
                return;
            }
            console.log('Posts table created successfully');
        }
    );

    // ResetTokens table
    client.query(
        `
        CREATE TABLE IF NOT EXISTS ResetTokens (
            tokenid SERIAL PRIMARY KEY,
            userid INT REFERENCES Users(userid) ON DELETE CASCADE,
            hashed_token TEXT UNIQUE NOT NULL,
            expires TIMESTAMP NOT NULL
        );`, 
        (err, res) => {
            if (err) {
                console.error('Error creating ResetTokens table:', err);
                return;
            }
            console.log('ResetTokens table created successfully');
        }
    );
}

function deleteTables() {
    client.query(
        `
        DROP TABLE IF EXISTS ResetTokens CASCADE;
        DROP TABLE IF EXISTS Posts CASCADE;
        DROP TABLE IF EXISTS Users CASCADE;
        DROP TABLE IF EXISTS Sessions CASCADE;`, 
        (err, res) => {
            if (err) {
                console.error('Error deleting tables:', err);
                return;
            }
            console.log('Tables deleted successfully');
        }
    )
}

function printUsers() {
    client.query('SELECT * FROM Users', (err, res) => {
        if (err) {
            console.error('Error fetching users:', err);
            return;
        }
        console.log('Users:', res.rows);
    });
}

function getPool() {
    return client;
}

// Users Table ---------------------------------------------------------

async function getAccount(email) {
    try {
        const queryOpts = {
            text: 'SELECT * FROM Users WHERE email = $1',
            values: [email]
        }

        const res = await client.query(queryOpts);
        return res.rows[0];
    } catch (err) {
        console.error('Error fetching account:', err);
        throw err;
    }
}

async function addUser(email, password, forename, surname) {
    try {
        const salt = bcrypt.genSaltSync(saltNumber);
        const pepperedPassword = password + process.env.PEPPER_SECRET_KEY + salt;
        const hashedPassword = await bcrypt.hash(pepperedPassword, saltNumber);
        
        const queryOpts = {
            text: 'INSERT INTO Users(email, hashed_password, forename, surname, salt) VALUES($1, $2, $3, $4, $5)',
            values: [email, hashedPassword, forename, surname, salt]
        }

        await client.query(queryOpts);
        console.log('User added successfully');
    } catch (err) {
        console.error('Error adding user:', err);
        throw err;
    }
}

async function verifyUser(email, password) {
    try {
        const queryOpts = {
            text: 'SELECT * FROM Users WHERE email = $1',
            values: [email]
        }

        const res = await client.query(queryOpts);
        if (res.rows.length === 0) {
            return false;
        }

        const user = res.rows[0];
        const pepperedPassword = password + process.env.PEPPER_SECRET_KEY + user.salt;
        return await bcrypt.compare(pepperedPassword, user.hashed_password);

    } catch (err) {
        console.error('Error verifying user:', err);
        throw err;
    }
}

async function getUserIDFromEmail(email) {
    try {
        const queryOpts = {
            text: `SELECT userid FROM users WHERE email = $1`,
            values: [email]
        };

        const result = await client.query(queryOpts);

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0].userid;
    } catch (err) {
        console.error("Error fetching user ID:", err);
        throw err;
    }
}

async function updatePassword(userid, password) {
    try {
        const user = await getUserById(userid);
        const pepperedPassword = password + process.env.PEPPER_SECRET_KEY + user.salt;
        const hashedPassword = await bcrypt.hash(pepperedPassword, saltNumber);

        const queryOpts = {
            text: `UPDATE users SET hashed_password = $1 WHERE userid = $2`,
            values: [hashedPassword, userid]
        };
        
        await client.query(queryOpts);
        console.log("Password updated successfully");
    } catch (err) {
        console.error("Error updating password:", err);
        throw err;
    }
}

async function getUserById(userid) {
    const result = await client.query({
        text: `SELECT userid, email, forename, surname, hashed_password, salt FROM users WHERE userid = $1`,
        values: [userid]
    });
    return result.rows[0];
}

async function updateUserDetails(userid, email, forename, surname) {
    await client.query({
        text: `UPDATE users SET email = $1, forename = $2, surname = $3 WHERE userid = $4`,
        values: [email, forename, surname, userid]
    });
}

// ResetTokens Table ---------------------------------------------------

async function addResetToken(userid, hashed_token, expires) {
    try {
        const queryOpts = {
            text: `INSERT INTO ResetTokens (userid, hashed_token, expires) VALUES ($1, $2, $3)`,
            values: [userid, hashed_token, expires]
        }

        await client.query(queryOpts);
        console.log('Reset token added successfully');
    } catch (err) {
        console.error('Error adding reset token:', err);
        throw err;
    }
}

async function getUserIdFromResetToken(hashed_token) {
    try {
        const queryOpts = {
            text: `SELECT userid FROM ResetTokens WHERE hashed_token = $1 AND expires > NOW()`,
            values: [hashed_token]
        };
        const result = await client.query(queryOpts);
        return result.rows.length > 0 ? result.rows[0].userid : null;
    } catch (err) {
        console.error('Error retrieving user ID from reset token:', err);
        throw err;
    }
}

async function deleteResetToken(hashed_token) {
    try {
        const queryOpts = {
            text: `DELETE FROM ResetTokens WHERE hashed_token = $1`,
            values: [hashed_token]
        };

        await client.query(queryOpts);
        console.log('Reset token deleted successfully');
    } catch (err) {
        console.error('Error deleting reset token:', err);
        throw err;
    }
}

async function resetTokenExists(hashed_token) {
    try {
        const result = await client.query({
            text: `SELECT hashed_token FROM ResetTokens WHERE hashed_token = $1`,
            values: [hashed_token]
        });
        return result.rows.length > 0;
    } catch (err) {
        console.error("Error checking for token existence:", err);
        throw err;
    }
}

// Posts Table ----------------------------------------------------------

async function getAllPosts() {
    try {
        const queryOpts = {
            text: `
                SELECT 
                    p.postid,
                    p.title,
                    u.forename,
                    u.surname
                FROM 
                    Posts p
                JOIN 
                    Users u ON p.userid = u.userid
                ORDER BY 
                    p.upload_date DESC
            `,
        };
        const res = await client.query(queryOpts);
        
        return res.rows;
    } catch (err) {
        console.error('Error fetching all posts:', err);
        throw err;
    }
}

async function getPost(postid) {
    try {
        const queryOpts = {
            text: `
            SELECT 
                p.postid,
                p.title,
                p.content,
                p.image,
                p.upload_date,
                u.forename,
                u.surname,
                u.userid
            FROM 
                Posts p
            JOIN 
                Users u ON p.userid = u.userid
            WHERE 
                p.postid = $1;`,
            values: [postid]
        };
        const result = await client.query(queryOpts);
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (err) {
        console.error("Error fetching post:", err);
        throw err;
    }
}

async function getAllPostsByUserID(userid) {
    try {
        const queryOpts = {
            text: `
                SELECT 
                    p.postid,
                    p.title,
                    u.forename,
                    u.surname
                FROM 
                    Posts p
                JOIN
                    Users u ON p.userid = u.userid
                WHERE 
                    p.userid = $1
                ORDER BY 
                    p.upload_date DESC;`,
            values: [userid]
        };
        const result = await client.query(queryOpts);
        return result.rows;
    } catch (err) {
        console.error("Error fetching posts by user ID:", err);
        throw err;
    }
}

async function addPost(userid, title, content, image) {
    try {
        const queryOpts = {
            text: 'INSERT INTO Posts(userid, title, content, image) VALUES($1, $2, $3, $4)',
            values: [userid, title, content, image]
        }

        await client.query(queryOpts);
        console.log('Post added successfully');
    }
    catch (err) {
        console.error('Error adding post:', err);
        throw err;
    }
}

async function editPost(post_id, title, content, image) {
    try {
        const queryOpts = {
            text: `
                UPDATE 
                    Posts 
                SET 
                    title = $1, 
                    content = $2, 
                    image = $3 
                WHERE 
                    postid = $4
            `,
            values: [title, content, image, post_id]
        }

        await client.query(queryOpts);
        console.log('Post updated successfully');
    }
    catch (err) {
        console.error('Error updating post:', err);
        throw err;
    }
}

async function deletePost(postid) {
    try {
        const queryOpts = {
            text: 'DELETE FROM Posts WHERE postid = $1',
            values: [postid]
        }

        await client.query(queryOpts);
        console.log('Post deleted successfully');
    }
    catch (err) {
        console.error('Error deleting post:', err);
        throw err;
    }
}

async function getPostsByQuery(query)
{
    try {
        const queryOpts = {
            text: `
                SELECT 
                    p.postid,
                    p.title,
                    u.forename,
                    u.surname
                FROM 
                    Posts p
                JOIN 
                    Users u ON p.userid = u.userid
                WHERE 
                    p.title ILIKE $1
                ORDER BY 
                    p.upload_date DESC;`,
            values: [`%${query}%`]
        };
        const result = await client.query(queryOpts);
        return result.rows;
    } catch (err) {
        console.error("Error fetching posts by query:", err);
        throw err;
    }
}

// Test Functions -------------------------------------------------------------
// deleteTables();
createTables();
// addUser('test@gmail.com', 'admin', 'admin', 'istrator');
// printUsers();

module.exports = {
    getPool,
    getAccount,
    addUser,
    verifyUser,
    addPost,
    getUserIDFromEmail,
    getAllPosts,
    addResetToken,
    getUserIdFromResetToken,
    deleteResetToken,
    updatePassword,
    resetTokenExists,
    getPost,
    getAllPostsByUserID,
    editPost,
    deletePost,
    getUserById,
    updateUserDetails,
    getPostsByQuery,
};