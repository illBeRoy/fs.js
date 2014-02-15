/*
    The file concludes of two pieces of code:
        1. The FS module - which provides the interface
        2. The FSO class - which provides an instanceable class for user input\output operations

    Few notes:
        1. You can have as many FSOs as you wish.
        2. Unless you're adding modifications of your own, there's no real reason to directly use the FS module within your code.
        3. Contrary to the
        3. The system uses localStorage keys containing the prefix "fsjs". Please refer from using that prefix.

    Default path syntax:
        1. "A/B" signifies that the current object is B (either a directory or a file), which is inside of A.
        2. "." stands for root.
        3. "../" stands for up level.
        4. Full path example: "./Dir1/Dir2/File"

    Default storage structures:
        1. Unless you are going to modify this code, there's no need to be acquainted with the internal storage object structures.
        2. If you do wish to study those, please refer to the assets directory
*/

// The FS Module:
window.FS = {

    // fs object holder
    _fs: undefined,

    // Configuration. You are welcome to edit these values.
    _config: {
        // Path delimiters
        delims: {
            path: "/",
            root: ".",
            up: ".."
        },
        // Type flags for file tree nodes
        types: {
            dir: "dir",
            file: "file"
        },
        // Default filesystem structure
        format: {contents: []},
        // localStorage prefix
        prefix: "fsjs",
        // Current fsjs version. If you're distributing a branch, please do add a prefix to identify this is indeed a branch. (like "branch_0.1")
        ver: "0.1"
    },

    // Contains all active FSOs. For syncronizing purposes.
    _pool: [],

    // Push FS into localStorage
    push: function()
    {
        localStorage.setItem(this._config.prefix, JSON.stringify(this._fs));
    },

    // Pull FS from localStorage
    pull: function()
    {
        var obj = localStorage.getItem(this._config.prefix);
        return obj ? JSON.parse(obj): false;
    },

    // Register FSOs on their creation - for syncronizing.
    registerInstance: function(obj)
    {
        this._pool.push(obj);
    },

    // Format
    format: function()
    {
        // Evacuate all FSOs to root
        for (var i = 0; i < this._pool.length; i++)
            this._pool[i]._path = this._config.delims.root;
        // Remove all related items
        for (key in localStorage)
            if (key.substr(0,this._config.prefix.length) == this._config.prefix)
                localStorage.removeItem(key);
        // Set _fs as default object. We use the JSON object in order to duplicate it rather than use it directly
        this._fs = JSON.parse(JSON.stringify(this._config.format));
        // ...And save it into the storage.
        this.push();
    },

    // Check validty of path
    validatePath: function(path)
    {
        // Get fs structure.
        var now = this._fs;
        // Split path.
        var parts = path.split(this._config.delims.path);
        // Try and fetch object
        return this.fetchObject(parts) ? true: false;
    },

    // Process relative paths
    processPath: function(curdir, path)
    {
        // Path should not end with dir delimiter
        if (path.substr(0 - this._config.delims.path.length) == this._config.delims.path)
            path = path.substr(0,path.length - this._config.delims.path.length);
        // Let's process
        var pathparts = path.split(this._config.delims.path),
            curdirparts = curdir.split(this._config.delims.path);
        // And iterate.
        for (var i = 0; i < pathparts.length; i++)
        {
            // If I'm root
            if (pathparts[i] == this._config.delims.root)
                curdirparts = [this._config.delims.root];
            // Otherwise, if I'm up symbol
            else if(pathparts[i] == this._config.delims.up)
                curdirparts.splice(curdirparts.length - 1, 1);
            // So I am a subfolder
            else
               curdirparts.push(pathparts[i]);
        }
        // Now join it all back into a string
        var output = curdirparts.join(this._config.delims.path);
        // If, for some reason, number of up-dirs exceeded root, it means string is empty and we should restore it to root.
        output = output == "" ? this._config.delims.root : output;
        // If path is valid - return it. If not - return original path.
        return this.validatePath(output) ? output: curdir;
    },

    listContents: function(path)
    {
        // Fetch current obj
        var obj = this.fetchObject(path.split(this._config.delims.path));
        // Make sure it EXISTS and is a DIR.
        if (!obj || obj.type == this._config.types.file)
            return [];
        var output = [];
        for (var i = 0; i < obj.contents.length; i++)
            output.push({name: obj.contents[i].name, type: obj.contents[i].type});
        return output;
    },

    // Create a new directory within a given path. Assumes path isn't malformed (and it shouldn't ever be!)
    appendDir: function(path, newdir)
    {
        // Check if dir is malformed (not allowed to contained directory delimiter)
        if (newdir.indexOf(this._config.delims.path) >= 0 || newdir == "")
            return false;
        var pathParts = path.split(this._config.delims.path);
        pathParts.push(newdir);
        // Try and fetch the dir we want to create
        if(this.fetchObject(pathParts))
            return false;
        // All good, insert the new directory. Start by removing the directory from the given path.
        pathParts.splice(pathParts.length - 1, 1);
        // Then fetch parent directory.
        var curdir = this.fetchObject(pathParts);
        // Now push a new fsjso into the existing tree.
        curdir.contents.push({
            name: newdir,
            type: this._config.types.dir,
            contents: []
        });
        // And save current tree to localStorage.
        this.push();
        return path + this._config.delims.path + newdir;
    },

    // Removes dir and all subdirs and files
    clearDir: function(path,dir)
    {
        // First of all, check for validity of the path.
        // Check if dir is malformed (not allowed to contained directory delimiter)
        if (dir.indexOf(this._config.delims.path) >= 0 || dir == "")
            return false;
        var pathParts = path.split(this._config.delims.path);
        pathParts.push(dir);
        // Try and fetch the dir we want to remove
        var temp = this.fetchObject(pathParts, true);
        // If not found or it's not a nested dir (root \ files will not have the dir type) - cancel operation
        if(!temp)
            return false;
        // Move pathparts back to parent's scope
        pathParts.splice(pathParts.length - 1, 1);
        // So, it exists! Let's evacuate all FSO's that are within it.
        for (var i = 0; i < this._pool.length; i++)
            if (this._pool[i]._path.substr(0,path.length + dir.length + this._config.delims.path.length) ==
                path + this._config.delims.path + dir)
                this._pool[i]._path = path; // Again, we assume the path is valid. So it's more efficient to directly set the var instead of cd().
        // Now, let's recursively remove all contained files.
        this.recursiveFileRemove(temp, path + this._config.delims.path + dir);
        // Remove the fsjso from the tree
        var parent = this.fetchObject(pathParts);
        for (var i = 0; i < parent.contents.length; i++)
        {

            if (parent.contents[i].name.toLowerCase() == dir.toLowerCase() && parent.contents[i].type == this._config.types.dir)
            {
                parent.contents.splice(i,1);
                break;
            }
        }
        // Last thing to do is to push it back to localStorage.
        this.push();
        // Finally, notify calling function all's good.
        return true;
    },

    // Removes all files in given fsjso and subdirs
    recursiveFileRemove: function(obj,path)
    {
        for (i = 0; i < obj.contents.length; i++)
        {
            // Child path's is:
            var childPath = path + this._config.delims.path + obj.contents[i].name;
            // If it's a file - remove it!
            if (obj.contents[i].type == this._config.types.file)
            {
                this.killFile(childPath);
                continue;
            }
            // Or, is it a directory - recursively delete all files within it as well.
            if (obj.contents[i].type == this._config.types.dir)
            {
                this.recursiveFileRemove(obj.contents[i], childPath);
                continue;
            }
            // Wait, what? Shouldn't happen! Please let me know if you reach here.
            console.warn("fsjs: undefined object type " + obj.contents[i].type + " found at " + childPath);
        }
    },

    // Edit given file's contents and returns them. If data is undefined, only returns.
    editFile: function(path, name, data)
    {
        // Make sure name is valid
        if (name.indexOf(this._config.delims.path) >= 0 || name == "")
            return false;
        // Get parent directory
        var obj = this.fetchObject(path.split(this._config.delims.path),true);
        // Check if file already exists
        var fileExists = this.getFileInDir(obj, name);
        // If file doesn't exist, push one into the array and update the storage
        if (fileExists == -1)
        {
            obj.contents.push({
                name: name,
                type: this._config.types.file});
            this.push();
        }
        // Finally, store data if defined, and to make sure - return it FROM localStorage
        if (typeof(data) != "undefined")
            this.putFile(path + this._config.delims.path + name, data);
        return this.getFile(path + this._config.delims.path + name);
    },

    // Removes a file object from the fsjs tree and its key from localStorage
    removeFileObj: function(path, name)
    {
        // Make sure name is valid
        if (name.indexOf(this._config.delims.path) >= 0 || name == "")
            return false;
        // Get parent directory
        var obj = this.fetchObject(path.split(this._config.delims.path),true);
        // Check if file exists
        var fileExists = this.getFileInDir(obj, name);
        // If file doesn't exist, we don't delete it, duh.
        if (fileExists == -1)
            return false;
        // If it does, delete it. First - the data:
        this.killFile(path + this._config.delims.path + name);
        // Then, the fsjso
        obj.contents.splice(fileExists,1);
        // Save to storage
        this.push();
        // Notify calling function
        return true;
    },

    // Get file within directory
    getFileInDir: function(dirObj, name)
    {
        var fileExists = -1;
        for (var i = 0; i < dirObj.contents.length; i++)
        {
            if (dirObj.contents[i].name.toLowerCase() == name.toLowerCase() && dirObj.contents[i].type == this._config.types.file)
            {
                fileExists = i;
                break;
            }
        }
        return fileExists;
    },

    // Fetch a directory \ file object. Gets the list of dirs from toppest to lowest.
    fetchObject: function(dirs, dirOnly)
    {
        // If the first one isn't root, the path is not absolute hence it's malformed.
        if (dirs[0] != this._config.delims.root)
            return false;
        var curobj = this._fs;
        // The first one should be the ROOT symbol, so skip it.
        for (var i = 1; i < dirs.length; i++)
        {
            var flag = -1;
            // Scan current dir looking for the next one
            for (var j = 0; j < curobj.contents.length; j++)
            {
                // Check matching name. Case insensitive.
                if (curobj.contents[j].name.toLowerCase() == dirs[i].toLowerCase())
                {
                    // Check its validty:
                    if (curobj.contents[j].type == this._config.types.dir || // If it's a dir, it's ok anyways
                        (curobj.contents[j].type == this._config.types.file && i == dirs.length - 1 && !dirOnly)) // If it's a file, ok only if last in line and dirOnly is false
                    {
                        flag = j;
                        break;
                    }
                }
            }
            // Now check if it found our object
            if (flag == -1) // not found :(
                return false;
            curobj = curobj.contents[flag];
        }
        return curobj;
    },

    // Put file in localStorage
    putFile: function(filePath, data)
    {
        localStorage.setItem(this._config.prefix + filePath.toLowerCase(), data);
    },

    // Get file from localStorage. False if nonexistent.
    getFile: function(filePath)
    {
        var data = localStorage.getItem(this._config.prefix + filePath.toLowerCase());
        return data ? data: false;
    },

    // Remove file key from localStorage
    killFile: function(filePath)
    {
        localStorage.removeItem("fsjs" + filePath.toLowerCase());
    },

    // Startup procedure
    startup: function()
    {
        // If _fs is not undefined, system is already running.
        if (typeof(this._fs) != "undefined")
            return true;
        // Otherwise, attempt loading structure from storage.
        this._fs = this.pull();
        // If failed to, format system
        if (!this._fs)
            this.format();
    }

};

// The FSO Class:

// Constructor
window.FSO = function(path){
    // 1. Initiate the FS interface
    FS.startup();
    // 2. Register this with the module
    FS.registerInstance(this);
    // 3. Set path to root
    this._path = FS._config.delims.root;
    // 4. move FSO to the given path (if possible)
    this.cd(path ? path: this._path);
};

// Prototype
window.FSO.prototype = {

    // Has to have current directory pointer.
    _path: "", // PRIVATE. Do not edit it directly! All functions assume that the path stored in here is valid.

    // cd (move pointer to a different director \ get current one) [in: path. out: current path]
    cd: function(path)
    {
        if(path)
            this._path = FS.processPath(this._path,path);
        return this._path;
    },

    // dir (list directory contents in current dir) [in: nothing. out: array of {name: name of object, type: type of object}]
    dir: function()
    {
        return FS.listContents(this._path);
    },

    // mkdir (creates a new directory) [in: name. out: path of newly made dir or false]
    mkdir: function(name)
    {
        return FS.appendDir(this._path,name);
    },

    // rmdir (removes an existing directory) [in: name. out: bool for success or not]
    rmdir: function(name)
    {
        return FS.clearDir(this._path,name);
    },

    // edit (creates \ edit file) [in: name, data (string or keep null if not wishing to edit). out: file contents]
    edit: function(name, data)
    {
        return FS.editFile(this._path, name, data);
    },

    // del (removes files) [in: name. out: bool for success or not]
    del: function(name)
    {
        return FS.removeFileObj(this._path,name);
    },

    // move (move files) [in: absolute path of original file, path of destination. out: bool for success or not]
    move: function(pathIn, pathOut)
    {
        // Fetch all path parts
        var inParts = pathIn.split(FS._config.delims.path),
            inName = inParts.splice(inParts.length - 1, 1)[0],
            outParts = pathOut.split(FS._config.delims.path),
            outName = outParts.splice(outParts.length - 1, 1)[0],
            inObj = FS.fetchObject(inParts),
            outObj = FS.fetchObject(outParts);
        // Verify both names and paths
        if (!inObj || !outObj || !inName || !outName)
            return false;
        // Get file cursors
        var inCursor = FS.getFileInDir(inObj,inName);
        // File exists?
        if (inCursor == -1)
            return false;
        // Fetch string, remove file
        var temp = FS.getFile(pathIn);
        FS.removeFileObj(inParts.join(FS._config.delims.path), inName);
        // And put it in new dir!
        FS.editFile(outParts.join(FS._config.delims.path),outName,temp);
        // Report success
        return true;
    },

    // format (restore whole file system to default) [in: nothing. out: bool for success or not]
    format: function()
    {
        FS.format();
        return true;
    },

    // ver (returns current fsjs version) [in: nothing. out: fsjs version]
    ver: function()
    {
        return FS._config.ver;
    },

    // toString() - define it to return the current path
    toString: function()
    {
        return this.cd();
    }

};
