# Web Modules - Coding Invest - version 1.0.0
A package to enable developers to work using a modular architecture, to easily add code from different sources and patterns avoiding coupled concepts, compiling it into output files with optimized performance and compatibility.

1. Create folders "src/modules", "src/components"

2. Create the file "src/modules/{module-name}.html", the file name should be the module

3. Create the files "src/components/{component-name}/{component-name}.html", "src/components/{component-name}/{component-name}.json"

4. Include at "src/modules/{module-name}.html" the html to be shared for the module and the calls to components
Ex.:
"
<!DOCTYPE html>
<html>
    <head>
        <title>Página de examplo - webmodules</title>
    </head>
    <body>
        <components-example></components-example>
    </body>
</html>
"

5. Include at "src/components/{component-name}/{component-name}.html" the component html code with the place holders "{{}}"
Ex.:
"
<div>
    <marquee>{{notice}}</marquee>
    <h1>{{highlight}}</h1>
    <p>{{text}}</p>
</div>
"

6. Include at  "src/components/{component-name}/{component-name}.json" the json with key and value of the place holers
Ex.:
"
{
    "fileName":"index",
    "notice":"this is a text inside marquee",
    "highlight":"This is a text inside h1 tag",
    "text":"this is a text inside p tag"
}
"

7. Create a file to use the class WebModulesBuilder
Ex.: index.js
"
const {WebModuleBuilder} = require('./web-modules-builder');
var webModuleBuilder = new WebModuleBuilder();
webModuleBuilder.onInit();
"

8. Run comand node index.js

9. Use the output of wwwroot into web server root

### Documentation and code will be modified in near future

### FOR THE NEXT RELEASE - Version 1.0.1
[] Code refactoring
[] Keep HTML formatation
... stay tuned