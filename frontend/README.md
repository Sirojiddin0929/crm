# EduCRM Admin Panel

**ZiyoNex dizaynidagi** professional admin panel.

## O'rnatish

```bash
npm install
npm run dev
```

Brauzerda: `http://localhost:3000`

Backend: `http://localhost:4000`

## Sahifalar

| Sahifa | URL | Tavsif |
|--------|-----|--------|
| Login | `/login` | Admin kirish |
| Dashboard | `/admin` | Statistika + grafiklar |
| Talabalar | `/admin/students` | Pagination, filter, coin +/-, drawer |
| O'qituvchilar | `/admin/teachers` | Reyting, pagination, drawer |
| Guruhlar | `/admin/groups` | Jadval + guruh detail + davomat kalender |
| Uyga vazifa | `/admin/homework` | Accordion + javoblarni baholash |
| Videolar | `/admin/videos` | Drag & drop upload modal |
| Boshqarish | `/admin/manage` | Kurslar, Xonalar, Xodimlar tablar |

## Texnologiyalar

- **React 18** + **Vite**
- **Tailwind CSS** (utility-first)
- **Lucide React** (ikonlar)
- **Recharts** (grafiklar)
- **Axios** (cookie-based auth)
- **React Hot Toast** (xabarnomalar)
- **Day.js** (sana formatlash)
- **Nunito** font (Google Fonts)

## Dizayn

ZiyoNex platformasi uslubida:
- `#1E1B2E` — qora sidebar
- `#7C3AED` — primary purple
- Barcha formlar right-side drawer sifatida
- Jadvallar pagination va filter bilan
- Toggle switch — guruh active/inactive
- Davomat — kalendar grid ko'rinishida
