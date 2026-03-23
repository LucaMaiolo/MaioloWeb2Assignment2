import express from 'express';
const app = express();

// errorController must always be last
const controllers: string[] = [
  'homeController.js',
  'jobController.js',
  'errorController.js'
];

app.use(express.json()); // parse JSON request bodies

/**
 * Dynamically imports each controller and registers its router.
 * Each controller must export routeRoot and router.
 */
async function registerControllers(): Promise<void> {
  for (const controllerName of controllers) {
    try {
      const controllerRoutes = await import(`./controllers/${controllerName}`);
      if (controllerRoutes?.routeRoot && controllerRoutes?.router) {
        app.use(controllerRoutes.routeRoot, controllerRoutes.router);
        console.log(`[app] Registered controller: ${controllerName}`);
      } else {
        throw new Error(`Invalid controller format: ${controllerName}`);
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

await registerControllers();

export default app;
