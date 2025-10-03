import { execSync } from "child_process"

async function generatePrismaClient() {
  try {
    console.log("🔄 Generating Prisma client...")
    execSync("prisma generate", { stdio: "inherit" })
    console.log("✅ Prisma client generated successfully!")
  } catch (error) {
    console.error("❌ Error generating Prisma client:", error)
    process.exit(1)
  }
}

async function setupDatabase() {
  try {
    console.log("🔄 Setting up database...")

    // Generate Prisma client first
    await generatePrismaClient()

    // Push schema to database
    console.log("🔄 Pushing schema to database...")
    execSync("prisma db push", { stdio: "inherit" })
    console.log("✅ Database schema updated!")

    console.log("🎉 Database setup complete!")
  } catch (error) {
    console.error("❌ Error setting up database:", error)
    process.exit(1)
  }
}

// Run setup if called directly
if (require.main === module) {
  const command = process.argv[2]

  if (command === "generate") {
    generatePrismaClient()
  } else if (command === "setup") {
    setupDatabase()
  } else {
    console.log("Usage: tsx scripts/generate-prisma.ts [generate|setup]")
  }
}

export { generatePrismaClient, setupDatabase }
