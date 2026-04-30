# REDESIGN_PLAN.md

## 1. Color Palette (Light Mode)
*   **Primary**: `#8B5A2B` (Warm Brown)
*   **Secondary**: `#D2B48C` (Tan)
*   **Surface**: `#FFFFFF` (White)
*   **Background**: `#F9F6F0` (Warm Gray)
*   **Text (Primary)**: `#2C1E16` (Deep Espresso)
*   **Text (Secondary)**: `#5C4A3D` (Muted Mocha)
*   **Status**: Success `#4CAF50`, Warning `#FF9800`, Error `#F44336`

## 2. Typography
*   **Font Stack**: `Inter`, `system-ui`, `sans-serif`
*   **Headings**: `Semibold` (H1: 24px, H2: 20px, H3: 18px)
*   **Body**: `Regular` (Base: 14px, Small: 12px)
*   **Buttons**: `Medium` 14px, uppercase, letter-spacing `0.05em`

## 3. Component Updates
| Component | Update Details |
| :--- | :--- |
| **MenuGrid** | Simplify layout. Use solid white cards with subtle shadow (`shadow-sm`) instead of glassmorphism. Remove heavy background blurs. |
| **CartDrawer** | Replace translucent overlay with solid warm-gray background. Make item rows compact with clear divider lines. |
| **OrderQueue** | Switch to solid surface cards (`bg-white`). Highlight status with solid color badges rather than glowing borders. |

## 4. Queue Finish Feature
*   **Action**: `finishOrderAction(orderId)` updates status to `completed`.
*   **UI**: "Mark as Done" Button on `OrderQueue` card (Visible ONLY to `BARISTA` role).
*   **UX**: Optimistic update immediately transitions UI; plays a short sound notification on success.

## 5. Image Assets Strategy
*   **Source**: Unsplash URLs for realistic item representation.
*   **Fallback**: `https://placeholder.co/400x400/D2B48C/2C1E16?text=ItemName`
*   **Storage**: Cache/store fallback assets in `public/images/menu/`.

## 6. Realistic Seed Data
| Category | Price Range (IDR) | Modifiers |
| :--- | :--- | :--- |
| **Coffee** | 25k - 45k | Size (Reg/Lrg), Milk (Oat/Almond), Extra Shot |
| **Non-Coffee** | 20k - 40k | Size (Reg/Lrg), Sugar (Normal/Less), Ice (Normal/Less) |
| **Pastry** | 15k - 30k | Warm up (Yes/No) |
| **Food** | 30k - 45k | Cutlery (Yes/No), Spicy Level (Low/Med/High) |
| **Add-ons** | 5k - 10k | Syrup (Vanilla/Caramel) |

*   **Items (20 Total)**: Balanced mix across the 5 categories (e.g., Americano, Matcha Latte, Butter Croissant, Club Sandwich).
*   **Sample Orders**: 10 realistic orders showing varied cart combinations and applied modifiers.
