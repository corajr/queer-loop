"use strict";

import fs from "fs-extra";
import path from "path";

/**
 * Adapted from
 * https://github.com/bengsfort/rollup-plugin-generate-html-template
 * (MIT license)
*/
export default function inliner (options = {}) {
    const { template, target } = options;
    return {
        name: "inliner",
        async writeBundle(bundleInfo) {
            const bundles = getEntryPoints(bundleInfo);

            return new Promise(async (resolve, reject) => {
                try {
                    if (!target && !template)
                        throw new Error(
                            "[rollup-plugin-inliner] You did not provide a template or target!"
                        );

                    // Get the target file name.
                    const targetName = path.basename(target || template);

                    // Add the file suffix if it isn't there.
                    const targetFile =
                          targetName.indexOf(".html") < 0 ? `${targetName}.html` : targetName;

                    // Read the file
                    const buffer = await fs.readFile(template);

                    // Convert buffer to a string and get the </body> index
                    const tmpl = buffer.toString("utf8");
                    const bodyCloseTag = tmpl.lastIndexOf("</body>");

                    // Inject the script tags before the body close tag
                    const injected = [
                        tmpl.slice(0, bodyCloseTag),
                        bundles.map(b => `<script class="main">${b.code}</script>\n`),
                        tmpl.slice(bodyCloseTag, tmpl.length),
                    ].join("");

                    // write the injected template to a file
                    const finalTarget = targetFile;

                    const originalTarget = bundles[0].fileName;

                    await fs.ensureFile(finalTarget);
                    await fs.writeFile(finalTarget, injected);
                    await fs.remove(originalTarget);
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });
        },
    };
}

function getEntryPoints(bundleInfo = {}) {
    const bundles = Object.keys(bundleInfo);
    return bundles.reduce((entryPoints, bundle) => {
        if (bundleInfo[bundle].isEntry === true) {
            entryPoints.push(bundleInfo[bundle]);
        }
        return entryPoints;
    }, []);
}
