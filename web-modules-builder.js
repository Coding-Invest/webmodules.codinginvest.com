const {FileHandler} = require('./file-handler');

function WebModuleBuilder() {
  const PATH_LAYOUT = 'src/modules';
  const OUTPUT_FOLDER = 'wwwroot';
  const fileExtensions = ['.html', '.css', '.js', '.json'];

  const fileHandler = new FileHandler();
  const placeholders = [];
  let components = [];
  
  this.onInit = function() {
    this.compile();
  };

  this.compile = async function() {
    await fileHandler.deleteDir(OUTPUT_FOLDER);
    await processLayouts();
    await processComponents();
    await createFiles();
  };

  async function createFiles() {
    let outputComponents = copyArray(components);
    outputComponents = outputComponents.filter((x) => x.out);
    await createFilesFromComponents(outputComponents);
  }

 async function createFilesFromComponents(outputComponents){
  for (let i = 0; i < outputComponents.length; i++) {
    const outputComponent = outputComponents[i];
    const componentsCopy = copyArray(components);
    const componentsFiltered = componentsCopy.filter((x) => !x.out);
    const memoryComponents = componentsFiltered.concat(outputComponent);
    replacePlaceHolders(memoryComponents,outputComponent);
    compileComponents(memoryComponents);
    const outputFile = getOutputFile(outputComponent, memoryComponents);
    await createDependentFolders(OUTPUT_FOLDER+"/"+outputFile.out);
    await fileHandler.write(OUTPUT_FOLDER + '/' + outputFile.out + '.html', outputFile.html);
  }
 }

 function compileComponents(memoryComponents){
  while (doesExistsFileToCompile(memoryComponents)) {
    const memoryComponentReady = memoryComponents.find((x) => !x.compiled);
    replaceTagsAtComponents(memoryComponents,memoryComponentReady);
    memoryComponentReady.compiled = true;
  }
 }

 function doesExistsFileToCompile(memoryComponents){
  return memoryComponents.findIndex((x) => !x.compiled) > -1;
 }

 function replaceTagsAtComponents(memoryComponents,componentReplaced){
  for (j = 0; j < memoryComponents.length; j++) {
    const componentToReplace = memoryComponents[j];
    componentToReplace.html = replaceTagAtComponent(componentReplaced.tag,componentToReplace.html,componentReplaced.html);
  }
 }

 function replaceTagAtComponent(tag,sourceHtml,html){
  while (tag && sourceHtml.search(tag) > -1) {
    sourceHtml = sourceHtml.replace(tag, html);
  }
  return sourceHtml;
 }

  async function createDependentFolders(folderPath){
    let folders = folderPath.split('/');
    if(folders.length>1){
      let path = folders[0];
      for(let i=0;i<folders.length-1;i++){
        await fileHandler.makeDirIfNotExists(path);
        path = path+"/"+folders[i+1];
      }
    }
  }

  function copyArray(array) {
    const obj = JSON.stringify(array);
    return JSON.parse(obj);
  }

  function getOutputFile(component, memoryComponents) {
    const parent = memoryComponents.find((x) => x.path + '/' + x.file == component.layout);
    parent.out = component.out;
    if (parent.layout) {
      return getOutputFile(parent, memoryComponents);
    }
    return parent;
  }


  function replacePlaceHolders(components, outputComponent) {
    const bufferPlaceholders = copyArray(placeholders.filter((x)=>x.value && components.findIndex(z=>x.filePath.indexOf(z.path)>-1)>-1));
    for (let i = 0; i < bufferPlaceholders.length; i++) {
      const placeholder = bufferPlaceholders[i];
      const othersPlaceholders = bufferPlaceholders.filter((x) => x.placeholder == placeholder.placeholder && placeholder.filePath != x.filePath && x.value);
      for (let j = 0; j < components.length; j++) {
        const component = components[j];
        const componentFilePath = component.path + '/' + component.file;
        const outputComponentFilePath = outputComponent.path + '/' + outputComponent.file;
        if (othersPlaceholders.findIndex((x) => x.filePath == componentFilePath || x.filePath==outputComponentFilePath) == -1 && placeholder.value) {
          while (component.html.indexOf(placeholder.tag) > -1) {
            component.html = component.html.replace(placeholder.tag, placeholder.value);
          }
        }
      }
    }
  }

  async function processLayouts() {
    const layouts = await getLayoutsFromDir(PATH_LAYOUT);
    for (let i = 0; i < layouts.length; i++) {
      const layout = layouts[i];
      await getComponentsFromHtml(layout);
      await getPlaceholderFromHtml(layout);
    }
    components = layouts;
  }

  async function processComponents() {
    const componentsProcessed = [];
    while (components.length > 0) {
      const component = components.shift();
      if (!component.file) {
        component.compiled = true;
        await getNextHtml(component);
      } else {
        await getComponentsFromHtml(component);
        await getPlaceholderFromHtml(component);
        await getPlaceHolderValues(component);
        componentsProcessed.push(component);
      }
    }
    components = componentsProcessed;
  }

  function isFilePath(path) {
    for (let i = 0; i < fileExtensions.length; i++) {
      const fileExtension = fileExtensions[i];
      if (path.indexOf(fileExtension) > -1) {
        return true;
      }
    }
    return false;
  }

  async function getNextHtml(component) {
    const paths = await fileHandler.dir(component.path);
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      let dir = component.path;
      if (!isFilePath(path)) {
        dir = dir + '/' + path;
      } else {
        continue;
      }
      const files = await getLayoutsFromDir(dir);
      const newComponent = {path: dir, tag: component.tag, layout: component.layout, compiled: false};
      if (files.length > 0) {
        newComponent.file = files[0].file;
        newComponent.html = await fileHandler.read(dir + '/' + files[0].file);
        components.push(newComponent);
      } else {
        await getNextHtml(newComponent);
      }
    }
  }

  async function getLayoutsFromDir(path) {
    const layouts = [];
    const filePaths = await fileHandler.dir(path);
    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      if (filePath.indexOf('.html') > -1) {
        const fileFullPath = path + '/' + filePath;
        const fileContent = await fileHandler.read(
            fileFullPath,
        );
        layouts.push({html: fileContent, path: path, file: filePath});
      }
    }
    return layouts;
  }

  async function getComponentsFromHtml(component) {
    let htmlWithTags = component.html.toString();
    const componentSearch = '<components-([A-z-])*></components-([A-z-])*>';
    while (htmlWithTags.search(componentSearch) > -1) {
      const componentCleanear = '</components-([A-z-])*>';
      const componentTag = htmlWithTags.match(componentSearch)[0];
      const componentDir = componentTag
          .replace(componentTag.match(componentCleanear)[0], '')
          .replace('<', '')
          .replace('>', '');
      const componentPathCapitalized = replaceDashForSlash(componentDir);
      const componentPath = 'src/' + replaceCapitalettersForDash(componentPathCapitalized);
      const fileHtmlPath = await fileHandler.dir(componentPath);
      const filePath = fileHtmlPath.find((x) => x.indexOf('.html') > -1);
      const newComponent = {path: componentPath, tag: componentTag, layout: component.path + '/' + component.file, compiled: false, file: filePath};
      if (newComponent.file) {
        newComponent.html = await fileHandler.read(componentPath + '/' + filePath);
      }
      components.push(newComponent);
      htmlWithTags = htmlWithTags.replace(componentTag, '');
    }
  }

  function replaceDashForSlash(content) {
    while (content.indexOf('-') > -1) {
      content = content.replace('-', '/');
    }
    return content;
  }

  function replaceCapitalettersForDash(content) {
    let contentOut = '';
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      if (char.toUpperCase() == char && checkIfCommonChar(char)) {
        const leftPart = content.substring(0, i);
        const rightPart = content.substring(i+1);
        contentOut = leftPart + '-' + char.toLowerCase() + rightPart;
        content = contentOut;
        contentOut = '';
        i = -1;
      } else {
        contentOut = contentOut + char;
      }
    }
    return contentOut;
  }

  function checkIfCommonChar(char) {
    const commonChars = 'abcdefghijklmnopqrstuvwyxz';
    return commonChars.indexOf(char.toLowerCase()) > -1;
  }

  async function getPlaceholderFromHtml(component) {
    let htmlWithPlaceHolders = component.html.toString();
    const placeholderSearch = '{{.*}}';
    while (htmlWithPlaceHolders.search(placeholderSearch) > -1) {
      const placeholderTag = htmlWithPlaceHolders.match(placeholderSearch)[0];
      const placeholder = placeholderTag.replace('{{', '').replace('}}', '');
      const filePath = component.path + '/' + component.file;
      if (placeholders.findIndex((x) => x.placeholder == placeholder && x.filePath == filePath) == -1) {
        placeholders.push({placeholder: placeholder, tag: placeholderTag, filePath: filePath});
      }
      htmlWithPlaceHolders = htmlWithPlaceHolders.replace(placeholderTag, '');
    }
  }

  async function getPlaceHolderValues(component) {
    const jsonContents = await readJsons(component.path);
    for (let i = 0; i < jsonContents.length; i++) {
      const jsonContent = jsonContents[i];
      const htmlPath = component.path + '/' + component.file;
      const jsonProperties = jsonContent.content;
      const componentPlaceHolders = placeholders.filter((x) => x.filePath == htmlPath);
      for (const key in jsonProperties) {
        if (key != 'fileName') {
          const placeholder = componentPlaceHolders.find((x) => x.placeholder == key);
          if (placeholder) {
            placeholder.value = jsonProperties[key];
          } else {
            placeholders.push({placeholder: key, tag: '{{' + key + '}}', filePath: htmlPath, value: jsonProperties[key]});
          }
        }
      }
      if (jsonProperties['fileName']) {
        component.out = jsonProperties['fileName'];
      }
    }
  }

  async function readJsons(path) {
    const filePaths = [];
    const files = await fileHandler.dir(path);
    const jsonFiles = files.filter((x) => x.indexOf('.json') > -1);
    for (let i = 0; i < jsonFiles.length; i++) {
      const jsonFile = jsonFiles[i];
      const jsonFilePath = path + '/' + jsonFile;
      filePaths.push({path: jsonFilePath, content: JSON.parse(await fileHandler.read(jsonFilePath))});
    }
    return filePaths;
  }
}

exports.WebModuleBuilder = WebModuleBuilder;