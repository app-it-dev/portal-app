# CarsGate Portal — New Posts Intake

A UI-only Next.js application for processing new posts with XLSX file uploads, content analysis, and image management.

## Features

- **XLSX Upload**: Upload Posts and Images XLSX files
- **Posts Table**: View, filter, and manage posts with status badges
- **Details Panel**: Four tabs for comprehensive post processing:
  - **Raw**: Paste and save raw page content
  - **Analyze**: Stub analysis with simulated delay
  - **Images**: Manage image selection (keep/main)
  - **Summary**: Validation and ready/insert actions
- **Keyboard Shortcuts**: J/K (navigate), V (view), R (reject/undo)
- **LocalStorage Persistence**: All data persists across browser sessions
- **Responsive Design**: Works on desktop and mobile

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Upload Files

1. **Posts XLSX**: Upload a file with columns `url` (required), `source` (optional), `note` (optional)
2. **Images XLSX**: Upload a file with columns `post_url` (required), `image_url` (required), `caption` (optional)

### Process Posts

1. Select a post from the table to open the Details Panel
2. **Raw Tab**: Paste raw page content and save
3. **Analyze Tab**: Run analysis (stub implementation with 0.8-2.0s delay)
4. **Images Tab**: Select which images to keep and set the main image
5. **Summary Tab**: Mark as ready and simulate insert

### Keyboard Shortcuts

- `J`: Next post
- `K`: Previous post  
- `V`: View post URL in new tab
- `R`: Toggle reject/undo reject

## Test Data

Sample CSV files are provided:
- `test-posts.csv`: Sample posts data
- `test-images.csv`: Sample images data

Convert these to XLSX format for testing.

## Technical Details

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom components
- **State Management**: Zustand with localStorage persistence
- **File Processing**: XLSX library for spreadsheet parsing
- **Icons**: Lucide React
- **Notifications**: Sonner for toast messages
- **Keyboard Shortcuts**: react-hotkeys-hook

## Data Format

### Posts XLSX
| Column | Required | Description |
|--------|----------|-------------|
| url | Yes | Post URL |
| source | No | Source website |
| note | No | Additional notes |

### Images XLSX
| Column | Required | Description |
|--------|----------|-------------|
| post_url | Yes | URL of the post this image belongs to |
| image_url | Yes | URL of the image |
| caption | No | Image caption |

## Status Flow

1. **pending**: Newly imported post
2. **rejected**: Manually rejected post
3. **analyzing**: Analysis in progress (stub)
4. **parsed**: Analysis complete with parsed JSON
5. **ready**: Validated and ready for insertion
6. **inserted**: Successfully inserted (simulated)

## LocalStorage

Data is persisted in localStorage with key `carsgate_newposts_v1`. Use the Reset button to clear all data.