-- Update desk points for all users based on their desk submissions
UPDATE users u
SET desk_points = COALESCE((
  SELECT SUM(overall_score)
  FROM submissions s
  WHERE s.user_id = u.id
    AND s.processing_status = 'completed'
    AND s.submission_mode = 'final'
    AND s.ai_type = 'desk'
), 0);

-- Update drawing points for all users based on their drawing submissions
UPDATE users u
SET drawing_points = COALESCE((
  SELECT SUM(overall_score)
  FROM submissions s
  WHERE s.user_id = u.id
    AND s.processing_status = 'completed'
    AND s.submission_mode = 'final'
    AND s.ai_type = 'drawing'
), 0);

-- Show results
SELECT 
  email,
  username,
  desk_points,
  drawing_points,
  total_points
FROM users
WHERE desk_points > 0 OR drawing_points > 0
ORDER BY (desk_points + drawing_points) DESC;

-- Made with Bob
