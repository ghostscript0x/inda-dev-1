# Setup Instructions

## 1. Install Dependencies

```bash
npm install prisma @prisma/client cloudinary bcryptjs jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken
```

## 2. Set Up Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Your Cloudinary API key
- `CLOUDINARY_API_SECRET` - Your Cloudinary API secret
- `JWT_SECRET` - Random string for JWT signing

## 3. Set Up Database

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

## 4. Run Development Server

```bash
npm run dev
```

## 5. Access Admin Dashboard

Go to `http://localhost:3000/admin`

Default credentials:
- Email: `admin@inda.name.ng`
- Password: `admin123`

**Change this password immediately in production!**

## API Endpoints

### Public
- `GET /api/content` - Get all portfolio content

### Admin (requires authentication)
- `POST /api/auth/login` - Login
- `GET /api/admin/profile` - Get profile
- `PUT /api/admin/profile` - Update profile
- `GET /api/admin/services` - List services
- `POST /api/admin/services` - Create service
- `PUT /api/admin/services` - Update service
- `DELETE /api/admin/services` - Delete service
- `GET /api/admin/experience` - List experience
- `POST /api/admin/experience` - Create experience
- `PUT /api/admin/experience` - Update experience
- `DELETE /api/admin/experience` - Delete experience
- `GET /api/admin/work` - List work
- `POST /api/admin/work` - Create work
- `PUT /api/admin/work` - Update work
- `DELETE /api/admin/work` - Delete work
- `POST /api/admin/upload` - Upload image to Cloudinary