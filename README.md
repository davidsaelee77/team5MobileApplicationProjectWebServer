Team-5-TCSS-450 Web Server

TOPICS:

- Mobile Platforms and architecture
- Constrained user Interfaces on mobile devices
- Design patterns used in the mobile frameworks
- State management
- Data managementWeb services and device location tracking
- Application development, testing and deployment (Software Development Life Cycle)

GOALS:

- Describe and explain the unique challenges relevant to mobile programming.
- Describe different mobile platform architectures.
- Implement user interfaces using mobile design principles for mobile devices.
- Program to support memory and power constrained devices.
- Apply software engineering principles to develop, test, package, and deploy mobile applications.

OUTCOME:

(In Progress) Buggy chat application that fulfills 90% of customer specifications.

# Description of Files in this package
* `package.json` and `package-lock.json`
    * These files are used to describe dependencies for the project. There are several packages we use for connecting to databases, connecting to our Mail client, etc.
    * Highly recommended reading: https://docs.npmjs.com/files/package.json
* `Procfile`
    * This is used by Heroku on deployment. It defines what command should be run to start the server.
    * Recommended reading: https://devcenter.heroku.com/articles/procfile
    * **NOTE** If you change the name of the .js file from index.js, you will need to update the Procfile accordingly.
* `.gitignore`
    * This file stops certain files from being commited in git, when you run `git add .`. For example, I'm using the vscode text editor, and it has a few files in the .vscode directory that aren't related to the code and therefore shouldn't be committed. 
    * Please avoid committing the `node_modules/` folder that will be created when you run `npm i`. Its a mess of a directory and contains a lot of stuff that's required for node.js to run, but really shouldn't be committed alongside the code
