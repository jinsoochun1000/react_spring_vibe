-- guest01 계정의 비밀번호를 'password123!' (BCrypt) 로 맞추는 스크립트
-- 사유: TB_USER 의 기존 해시(전 계정 동일 더미값)가 'password123!' 와 일치하지 않아 로그인 불가.
-- 되돌리기: 아래 원복 해시로 UPDATE
--   $2a$10$wE9K2jT7W70j46kZf1xXf.WwN8tB/Vq2p1aI.9V0O2ZqU9tD1TteC

UPDATE TB_USER
   SET PASSWORD   = '$2a$10$/kweZuwoLP2vaZylBw7MIOyzp7NB3/zkl.o/pgZSjtPShOzv4m95G',
       UPDATED_AT = SYSTIMESTAMP
 WHERE USERNAME = 'guest01';

COMMIT;
