import { setLicenseText } from "@luciad/ria/util/License.js";

// Use a loader library or add custom code to vite.config.js to load the string as a string
// @ts-ignore
import txt from './luciadria_development.txt?raw-txt';

setLicenseText(txt);
