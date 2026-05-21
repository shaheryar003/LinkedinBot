#!/bin/bash

echo "🚀 LinkedIn Bot Setup Script"
echo "=============================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL not found. Make sure it's installed and running."
else
    echo "✅ PostgreSQL found"
fi

# Check if Redis is running
if ! command -v redis-cli &> /dev/null; then
    echo "⚠️  Redis not found. Make sure it's installed and running."
else
    echo "✅ Redis found"
fi

echo ""
echo "📦 Installing Backend Dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Backend installation failed"
    exit 1
fi
echo "✅ Backend dependencies installed"

echo ""
echo "📦 Installing Frontend Dependencies..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Frontend installation failed"
    exit 1
fi
echo "✅ Frontend dependencies installed"

echo ""
echo "🔧 Setting up environment files..."
cd ..

# Backend .env
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env (please edit with your credentials)"
else
    echo "⚠️  backend/.env already exists"
fi

# Frontend .env.local
if [ ! -f frontend/.env.local ]; then
    cp frontend/.env.local.example frontend/.env.local
    echo "✅ Created frontend/.env.local"
else
    echo "⚠️  frontend/.env.local already exists"
fi

echo ""
echo "🗄️  Setting up database..."
cd backend

# Generate Prisma client
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Prisma generate failed"
    exit 1
fi
echo "✅ Prisma client generated"

# Run migrations
echo "Running database migrations..."
npx prisma migrate dev --name init
if [ $? -ne 0 ]; then
    echo "⚠️  Database migration failed. Make sure PostgreSQL is running and DATABASE_URL is correct."
else
    echo "✅ Database migrations completed"
fi

cd ..

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Edit backend/.env with your credentials:"
echo "   - OPENAI_API_KEY"
echo "   - LINKEDIN_EMAIL and LINKEDIN_PASSWORD"
echo "   - DATABASE_URL (if not using default)"
echo ""
echo "2. Start the backend:"
echo "   cd backend && npm run dev"
echo ""
echo "3. Start the frontend (in a new terminal):"
echo "   cd frontend && npm run dev"
echo ""
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "5. Go to Settings and test your connections"
echo ""
echo "🎉 Happy automating!"
