INSERT INTO brainstorms (user_id, title, created_at, summary)
VALUES (1, 'Improving product design', '2022-01-01 00:00:00', 'Summary 1'),
       (1, 'Increasing customer engagement', '2022-01-02 00:00:00', 'Summary 2');

INSERT INTO brainstorm_messages (brainstorm_id, role, content, created_at)
VALUES (1, 'user', 'I want to brainstorm about improving our product design.', '2022-01-01 00:01:00'),
       (1, 'assistant', 'That sounds interesting. Can you tell me more about the current design?', '2022-01-01 00:02:00'),
       (2, 'user', 'I am thinking about ways to increase our customer engagement.', '2022-01-02 00:01:00'),
       (2, 'assistant', 'Great! What engagement strategies have you tried so far?', '2022-01-02 00:02:00');