# Iframe Map Application

This is the core LuciadRIA map component designed to be embedded within a host application. It acts as an "off-the-shelf" viewer that communicates with its parent via a type-safe interface.

## Quick Start

### 1. Installation
Install dependencies from the root directory:
```bash
npm install
```

### 2. Built-in Development
To run the iframe application in development mode:
```bash
npm run dev
```
The application will be available at `http://localhost:5174`.

### 3. Build for Production
To generate a production-ready bundle:
```bash
cd iframe-app
npm run build
```
The optimized assets will be located in the `dist` folder, ready for deployment to any static web server.

## Deployment
Simply host the contents of the `dist` folder. The application is self-contained and expects to be controlled by a parent window via the `greencubes-iframe-interface` library.
