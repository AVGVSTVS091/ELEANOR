# AGUAI CRM Deployment Guide

This guide provides instructions to deploy the AGUAI CRM application to a static hosting provider like Netlify or Vercel, ensuring Single-Page Application (SPA) routing works correctly.

## Pre-requisites

- A ZIP file of the application source code.
- Your custom assets (splash screen image and notification sounds if you plan to replace the defaults).
- A Netlify or Vercel account.

## Deployment Steps

1.  **Unzip the Package**
    Unzip the provided application zip file. The folder contains all the necessary files, including `index.html`, `_redirects`, and the `assets` directory.

2.  **(Optional) Replace External Assets**
    Navigate to the `assets/` directory to replace placeholder assets.

    *   **Splash Screen**: Replace `assets/aguai/logo.png`.
    *   **Notification Sounds**: Replace the `.mp3` files inside `assets/aguai/sounds/`. The filenames must match the existing ones.

3.  **Deploy to Netlify/Vercel**
    *   Log in to your Netlify or Vercel account.
    *   From your team or personal dashboard, find the "Add new site" and choose "Deploy manually".
    *   Drag and drop the **entire unzipped application folder** into the deployment area.
    *   The hosting provider will upload and deploy the site.

## Key Configuration File: `_redirects`

This project includes a `_redirects` file in the root directory. **This file is critical for Netlify deployment.**

*   **Purpose**: It tells Netlify how to handle routing for a Single-Page Application. Without it, refreshing the page on a route like `/clients/123` will result in a 404 error.
*   **Content**: The file contains a single rule: `/* /index.html 200`. This rule redirects all incoming requests to `index.html`, allowing the React router to handle them.
*   **Verification**: Ensure this file is at the root of the folder you are deploying.

## Environment Variables

This application requires a **Google Gemini API Key** to function correctly. This key must be configured in your hosting provider's environment variables.

*   **Variable Name**: `API_KEY`
*   **Value**: `Your_Gemini_API_Key_Here`

Set this variable in your site's "Environment Variables" section in the Netlify or Vercel dashboard.

## Local Testing & Validation

Before deploying, you can verify that the SPA routing fallback is configured correctly.

1.  Open a terminal in the root of the application folder.
2.  Install a static server if you don't have one: `npm install -g serve`
3.  Run the server with the SPA flag: `serve -s .`
    *   The `-s` flag tells `serve` to handle all routes by serving the `index.html` file, mimicking the behavior of the `_redirects` file on Netlify.
4.  Open your browser to the local address provided (e.g., `http://localhost:3000`).
5.  Navigate to a deep link manually (e.g., go to the clients page, then refresh, or directly enter a URL like `http://localhost:3000/some/route`). The application should load correctly instead of showing a "Not Found" error.

## Native / APK Splash Screens

To prepare the application for conversion to a native Android/iOS app, you will need to provide splash screen assets in various sizes. Place your master splash screen image at the path below for easy access during the packaging process.

- **Master Image Path**: `assets/aguai/logo.png`

### Recommended Sizes for Android & iOS

Ensure you have the following image sizes available for the native build process:

- **Standard Icons (MDPI, HDPI, XHDPI, etc.)**:
  - `48x48` px
  - `72x72` px
  - `96x96` px
  - `144x144` px
  - `192x192` px
- **Store & High-Res Icons**:
  - `512x512` px
- **Adaptive Splash Screens (Android)**:
  - A `108dp` icon on a `432dp` canvas. The icon itself should be within a `72dp` safe zone. Provide both foreground (with transparency) and background layers.
- **Launch Screens (iOS)**:
  - Provide images for various device sizes (e.g., iPhone SE, iPhone 15 Pro Max, iPad Pro) as specified in Xcode's asset catalog. A single, centered image on a solid background color is often sufficient.