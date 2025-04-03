# 🌍 Roamly

**Roamly** is a modern travel planning web app that helps you create your ideal trip by placing points on a map, generating routes, and discovering activities and places to visit along the way.

<img width="1726" alt="image" src="https://github.com/user-attachments/assets/642f2023-3892-428e-9b11-304780f90033" />

## 🚀 Features

- 🗺️ Interactive map with **Leaflet** & **OpenStreetMap**
- 📍 Add waypoints and visualize your route
- 🔍 Discover activities and places between each stop (via **GPT 4o Mini** API)
- ✅ Auth system with **Supabase**
- 🧾 Trip saving in Supabase database (routes, waypoints, etc.)
- 🎨 Built with **Next.js 15**, **Tailwind CSS**, **shadcn/ui**
- 📦 Validated forms using **Zod**
- 🧪 Unit tests with **Jest**
- ⚙️ CI with **GitHub Actions**
- ☁️ Deployed on **Vercel**

## 🧑‍💻 Tech Stack

| Tech             | Purpose                          |
|------------------|----------------------------------|
| Next.js 15       | App framework (App Router)       |
| Tailwind CSS     | Utility-first styling            |
| shadcn/ui        | Beautiful & accessible UI        |
| Zod              | Schema validation                |
| Supabase         | Auth & PostgreSQL database       |
| Leaflet          | Interactive maps                 |
| OpenStreetMap    | Free map data                    |
| GPT 4o Mini API  | Activity/location suggestions    |
| Jest             | Unit testing                     |
| GitHub Actions   | CI/CD pipelines                  |
| Vercel           | Deployment                       |

## 🗃️ Database Structure

Supabase table: `routes`

| Column       | Type    | Description                              |
|--------------|---------|------------------------------------------|
| `id`         | UUID    | Unique route ID                          |
| `name`       | String  | Name of the trip                         |
| `locationInfo` | JSON | Metadata for route locations              |
| `waypoints`  | JSON    | List of coordinates and points           |
| `user_id`    | UUID    | Reference to the authenticated user      |
| `created_at` | Date    | Timestamp of creation                    |

## 🔐 Authentication

- Supabase handles user authentication and session management.
- SSR and client-side authenticated routes are supported.

## 🧪 Testing & CI

- Written with **Jest**
- **GitHub Actions** pipeline runs tests on push/PR

## 🌐 Deployment

Roamly is deployed on **[Vercel](https://roamly-theta.vercel.app/)**.

## 📦 Installation

```bash
# Clone the repo
git clone https://github.com/your-username/roamly.git
cd roamly

# Install dependencies
pnpm install

# Run the development server
pnpm dev
```
env structure
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPEN_API_KEY=
```
## 🤝 Contributing

Contributions are welcome!  
If you have ideas for new features, improvements, or bug fixes, feel free to open an issue or submit a pull request.

Before contributing, please:

- Fork the repository
- Create a new branch (`git checkout -b feature/your-feature-name`)
- Commit your changes (`git commit -m 'Add feature'`)
- Push to the branch (`git push origin feature/your-feature-name`)
- Open a Pull Request

Please make sure to follow the existing code style and structure.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

Made with 💙 by Quentin Drouet, Edgar Lecomte and Romain Malaterre




