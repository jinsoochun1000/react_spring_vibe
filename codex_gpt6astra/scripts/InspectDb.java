import java.sql.*;
public class InspectDb {
 public static void main(String[] args) throws Exception {
  try (var c=DriverManager.getConnection(System.getenv("DB_URL"),System.getenv("DB_USERNAME"),System.getenv("DB_PASSWORD"));var s=c.createStatement()) {
   for(String q: new String[]{"SELECT USER_ID,USERNAME,ROLE,CASE WHEN PASSWORD LIKE '$2%' THEN 'BCRYPT' WHEN PASSWORD LIKE '{bcrypt}%' THEN 'PREFIXED_BCRYPT' ELSE 'OTHER' END AS PASSWORD_FORMAT FROM TB_USER WHERE USERNAME='guest01'", "SELECT COUNT(*) FROM TB_POST", "SELECT table_name,column_name,char_used,char_length FROM user_tab_columns WHERE table_name IN ('TB_USER','TB_POST') AND data_type='VARCHAR2'", "SELECT table_name,constraint_name,constraint_type FROM user_constraints WHERE table_name IN ('TB_USER','TB_POST')", "SELECT trigger_name,status FROM user_triggers WHERE table_name IN ('TB_USER','TB_POST')"}) {
    try(var r=s.executeQuery(q)){while(r.next()){for(int i=1;i<=r.getMetaData().getColumnCount();i++)System.out.print(r.getString(i)+" | ");System.out.println();}}
   }
  }
 }
}
