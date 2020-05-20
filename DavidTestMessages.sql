--Remove all memebers from all chats
DELETE FROM ChatMembers;

--Remove all messages from all chats
DELETE FROM Messages;

--Remove all chats
DELETE FROM Chats;

--Remove the user test1
DELETE FROM Members 
WHERE Email='test1@test.com';

--Add the User test1  (password is: test12345)
INSERT INTO 
    Members(FirstName, LastName, Username, Email, Password, Salt)
VALUES
    ('test1First', 'test1Last', 'test1', 'test1@test.com', 'aafc93bbad0671a0531fa95168c4691be3a0d5e033c33a7b8be9941d2702e566', '5a3d1d9d0bda1e4855576fe486c3a188e14a3f1a381ea938cacdb8c799a3205f');

--Remove the user test2
DELETE FROM Members 
WHERE Email='test2@test.com';

--Add the User test2  (password is: test12345)
INSERT INTO 
    Members(FirstName, LastName, Username, Email, Password, Salt)
VALUES
    ('test2First', 'test2Last', 'test2', 'test2@test.com', 'aafc93bbad0671a0531fa95168c4691be3a0d5e033c33a7b8be9941d2702e566', '5a3d1d9d0bda1e4855576fe486c3a188e14a3f1a381ea938cacdb8c799a3205f');

--Remove the user test3
DELETE FROM Members 
WHERE Email='test3@test.com';

--Add the User test3 (password is: test12345)
INSERT INTO 
    Members(FirstName, LastName, Username, Email, Password, Salt)
VALUES
    ('test3First', 'test3Last', 'test3', 'test3@test.com', 'aafc93bbad0671a0531fa95168c4691be3a0d5e033c33a7b8be9941d2702e566', '5a3d1d9d0bda1e4855576fe486c3a188e14a3f1a381ea938cacdb8c799a3205f');


--Remove the user dsael1
DELETE FROM Members 
WHERE Email='dsael1@uw.edu';

--Add the User dsael1 (password is: A1234567!)
INSERT INTO 
    Members(FirstName, LastName, Username, Email, Password, Salt)
VALUES
    ('David', 'Saelee', 'dsael1', 'dsael1@uw.edu', 'aafc93bbad0671a0531fa95168c4691be3a0d5e033c33a7b8be9941d2702e566', '5a3d1d9d0bda1e4855576fe486c3a188e14a3f1a381ea938cacdb8c799a3205f');


--Create Global Chat room, ChatId 1
INSERT INTO
    chats(chatid, name)
VALUES
    (1, 'Global Chat')
RETURNING *;

--Add the three test users to Global Chat
INSERT INTO 
    ChatMembers(ChatId, MemberId)
SELECT 1, Members.MemberId
FROM Members
WHERE Members.Email='test1@test.com'
    OR Members.Email='test2@test.com'
    OR Members.Email='test3@test.com'
    OR Members.Email='dsael1@uw.edu'
RETURNING *;

--Add Multiple messages to create a conversation
INSERT INTO 
    Messages(ChatId, Message, MemberId)
SELECT 
    1, 
    'Sup Guys!!',
    Members.MemberId
FROM Members
WHERE Members.Email='test1@test.com'
RETURNING *;

INSERT INTO 
    Messages(ChatId, Message, MemberId)
SELECT 
    1, 
    'hello',
    Members.MemberId
FROM Members
WHERE Members.Email='test2@test.com'
RETURNING *;

INSERT INTO 
    Messages(ChatId, Message, MemberId)
SELECT 
    1, 
    'Hey Test1, how is it going?',
    Members.MemberId
FROM Members
WHERE Members.Email='test3@test.com'
RETURNING *;

INSERT INTO 
    Messages(ChatId, Message, MemberId)
SELECT 
    1, 
    'Great, thanks for asking t3',
    Members.MemberId
FROM Members
WHERE Members.Email='test1@test.com'
RETURNING *;

INSERT INTO 
    Messages(ChatId, Message, MemberId)
SELECT 
    1, 
    'Errr... Did I enter the wrong chat?',
    Members.MemberId
FROM Members
WHERE Members.Email='dsael1@uw.edu'
RETURNING *;


INSERT INTO 
    Messages(ChatId, Message, MemberId)
SELECT 
    1, 
    'Enough with the pleasantries',
    Members.MemberId
FROM Members
WHERE Members.Email='test2@test.com'
RETURNING *;

INSERT INTO 
    Messages(ChatId, Message, MemberId)
SELECT 
    1, 
    'Yeah you weirdo!  You don't belong here!',
    Members.MemberId
FROM Members
WHERE Members.Email='test2@test.com'
RETURNING *;

INSERT INTO 
    Messages(ChatId, Message, MemberId)
SELECT 
    1, 
    'CHILL out t3 lol',
    Members.MemberId
FROM Members
WHERE Members.Email='test3@test.com'
RETURNING *;

INSERT INTO 
    Messages(ChatId, Message, MemberId)
SELECT 
    1, 
    'You're a big meany you know that!',
    Members.MemberId
FROM Members
WHERE Members.Email='dsael1@uw.edu'
RETURNING *;


INSERT INTO 
    Messages(ChatId, Message, MemberId)
SELECT 
    1, 
    'CHILL EVERYONE!',
    Members.MemberId
FROM Members
WHERE Members.Email='test1@test.com'
RETURNING *;

INSERT INTO 
    Messages(ChatId, Message, MemberId)
SELECT 
    1, 
    'Yes, chill please.',
    Members.MemberId
FROM Members
WHERE Members.Email='test2@test.com'
RETURNING *;

INSERT INTO 
    Messages(ChatId, Message, MemberId)
SELECT 
    1, 
    'I'll see myself out of here.',
    Members.MemberId
FROM Members
WHERE Members.Email='dsael1@uw.edu'
RETURNING *;


INSERT INTO 
    Messages(ChatId, Message, MemberId)
SELECT 
    1, 
    'See ya later alligator!',
    Members.MemberId
FROM Members
WHERE Members.Email='test2@test.com'
RETURNING *;

INSERT INTO 
    Messages(ChatId, Message, MemberId)
SELECT 
    1, 
    'Not for a while crocodile.',
    Members.MemberId
FROM Members
WHERE Members.Email='test2@test.com'
RETURNING *;

INSERT INTO 
    Messages(ChatId, Message, MemberId)
SELECT 
    1, 
    'Back to business.',
    Members.MemberId
FROM Members
WHERE Members.Email='test3@test.com'
RETURNING *;

INSERT INTO 
    Messages(ChatId, Message, MemberId)
SELECT 
    1, 
    'What's blocking you test1?',
    Members.MemberId
FROM Members
WHERE Members.Email='test1@test.com'
RETURNING *;


INSERT INTO 
    Messages(ChatId, Message, MemberId)
SELECT 
    1, 
    'Nothing.',
    Members.MemberId
FROM Members
WHERE Members.Email='test1@test.com'
RETURNING *;


INSERT INTO 
    Messages(ChatId, Message, MemberId)
SELECT 
    1, 
    'ARGH!!!!, I'm stuck.',
    Members.MemberId
FROM Members
WHERE Members.Email='dsael1@uw.edu'
RETURNING *;

INSERT INTO 
    Messages(ChatId, Message, MemberId)
SELECT 
    1, 
    'I can't find my way out of here!',
    Members.MemberId
FROM Members
WHERE Members.Email='dsael1@uw.edu'
RETURNING *;

