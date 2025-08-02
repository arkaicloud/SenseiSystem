
const { storage } = require("./server/storage");

async function debugLogin() {
  console.log("🔍 Checking default users...");
  
  try {
    const adminUser = await storage.getUserByEmail("adm@senseisystem.com.br");
    console.log("Admin user:", adminUser ? "✅ Found" : "❌ Not found");
    if (adminUser) {
      console.log("Admin details:", {
        id: adminUser.id,
        email: adminUser.email,
        active: adminUser.active,
        role: adminUser.role
      });
    }
    
    const studentUser = await storage.getUserByEmail("aluno@senseisystem.com.br");
    console.log("Student user:", studentUser ? "✅ Found" : "❌ Not found");
    if (studentUser) {
      console.log("Student details:", {
        id: studentUser.id,
        email: studentUser.email,
        active: studentUser.active,
        role: studentUser.role
      });
    }

    const allUsers = await storage.getUsers();
    console.log("Total users in database:", allUsers.length);
    allUsers.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - ${user.active ? 'Active' : 'Inactive'}`);
    });
    
  } catch (error) {
    console.error("❌ Debug error:", error);
  }
}

debugLogin();
