fs.js
=====

The fs.js library provides you with a filesystem-like interface when dealing with localStorage.

## So, what is it again?

fs.js introduces the user with an object called FSO (Filesystem object, obviously), which concludes of a variety of "dos", or "shell" like commands that, in turn, allow the creation of directories and files as an understandable "filetree" within the localStorage environment.

That said, the FSO object acts like a commandline terminal: it has a variety of file managment commands and is using relative path referencing, meaning it remembers your current location within the filesystem just like a real terminal.

Once you instantiate an FSO object for the very first time (per domain and client, not per page), a filetree item (called fsjso) is created inside your localStorage, allowing you to navigate, create, move and delete files and directories using simple commands and pathstrings. (Example: fso.cd("dir1/dir2/..") is equivalent to the dos command CD, with the relative path eventually leading to dir1).

## I think I get it, you create a filetree within the localStorage sandbox. Why do I need that?

Well, say you are creating a web app (or even a mobile one, using technologies such as Phonegap) and want to provide your users with the ability to manipulate and organize their work, fsjs provides you the interface to easily manage such operations. Without fsjs, you'd have to manage a whole set of localStorage items: list them, sort them, edit and remove. fsjs does all that for you - with minimum effort on your side.

## Okay, an example would be much appreciated.

You got it!

Let's say you want to create a simple filetree consisting of three directores, one sub-directory and a file containing the string "hello world":

```Javascript

var fso = new FSO(); // Creates a new fso instance. You can also pass a string parameter to set the initial directory. The default one is root.
fso.format(); // Deletes existing fsjs filetree and restores it to default.
fso.mkdir("a"); // Creates dirs a,b,c inside root.
fso.mkdir("b");
fso.mkdir("c");
fso.cd("a"); // Moves fso current location to inside ./a/
fso.mkdir("d"); // Creates the directory ./a/d
fso.edit("file.txt", "Hello, world!"); // Creates the file 'file.txt' within ./a/ and puts the string "Hello, world!" within it.
fso.cd(".."); // Goes up one level, back to root.

```

Not too complicated now, is it?

## How do I implement it?

Inside the /src folder you will find the sole file needed in order to start using fsjs. The library is highly independant and compatibale - meaning it works on any client that has localStorage support (all browsers dating about 5 years back), and shouldn't be clashing any other js library (even ones manipulating localStorage, as it uses a reserved prefix).

All **you** have to do is include the script in your page, instantiate an FSO object and you're ready to go!

## Let's get down to business. Please describe the API.

Sure. fsjs library contains two main objects:

* The **FSO** class
* The **FS** module

But first, let's describe how file paths work:

### File Paths

There are two kinds of paths:
* Absolute paths
* Relative paths

**Absolute** paths **always** begin with the root symbol (".").
Example: ./a/b - is an absolute path directing the object into directory b, which is inside a, which is inside the root.

**Relative** paths are directing the object into directories describing the paths relatively to where they are currently.
Example: Current FSO is inside directory ./a/c . We want to go into directory ./a/b, so we'll use the following path: ../b (basically telling the object to go back up one level, into directory a, and then into directory b located within a).

### The FSO Class

Each instance of the **FSO** class acts as an independant terminal. You can have as many as you want, without fearing of one interfering with another; All actions made by a single FSO object are instantly synchronized with the rest.

Here's a full description of the *FSO* class:

```Javascript

// Constructor
window.FSO = function(path)
{/*
    Path parameter is optional, and should be an absolute path or a path relative to root. (Meaning a/b will work as well as ./a/b)
    If passed path does not exist, object will be redirected to root.

    Example:
        var fso = new FSO(); // Creates new FSO object at root.
        var fso = new FSO("a/b"); // Creates new FSO object at ./a/b
        var fso = new FSO("./a/b"); // Same as above
*/}

window.FSO.prototype = {

    _path: "", // Current path pointer. It's a private variable, and you should not be interacting with it AT ALL.

    // cd (move pointer to a different directory \ get current one) [in: <path>:String (optional). out: <current path>:String]
    cd: function(path)
    {/*
        This method gets a path (and treats it as a relative one), validates it, moves path pointer to its location if valid, and returns it.
        If no path is passed, or destination is inavlid, it simply returns the current path pointer.

        Example:
            fso.cd("../a/b"); // goes up one level, then into directory a and b. Returns path.
            fso.cd(); // Returns path, without changing the pointer.
    */},

    // dir (list directory contents in current dir) [in: nothing. out: array of {name: <name of object>:String, type: <type of object>:String}]
    dir: function()
    {/*
        Returns an array containing all current path's child directories and files.
        Note: It does not sort the list, so dirs and fils are returned by order of creation, rather than by type or name.

        Example:
            fso.dir() // Say we're inside a directory containing dirs a, b and file c:
            // Returns: [ { name: "a", type: "dir" } , { name: "b", type: "dir" } , { name: "c", type: "file" } ]
    */},

    // mkdir (creates a new directory) [in: <name>:String. out: <path of newly made dir>:String or <false if failed>:Boolean]
    mkdir: function(name)
    {/*
        This method gets a name parameter, validates it, attempts to create a directory and returns the created directory ABSOLUTE path or false.
        Reasons for failure: Name is invalid (contains directory delimiters "/") or directory already exists.
        Note: This will NOT move the path pointer into the newly created directory.

        Example:
            fso.mkdir("a") // Inside root - will return ./a
            fso.mkdir("a") // Returns false, dir ./a already exists
            fso.mkdir("a/b") // Returns false, malformed directory name
    */},

    // rmdir (removes an existing directory) [in: <name>:String. out: <bool for success or not>:Boolean]
    rmdir: function(name)
    {/*
        This method will try to remove an existing directory within the current path.
        NOTE: This will recursively remove all contained dirs, subdirs and files. Also, all FSO instances that are located within the directory
            or any of its subdirs, will be moved to parent directory.

        Example:
            var a = new FSO("./a"); // Creates an fso object located in dir ./a
            var b = new FSO("./a/b"); // Creates an fso object located in dir ./a/b
            b.cd(); // Will return ./a/b
            a.rmdir("b") // Will return true
            b.cd(); // Will return ./a because dir b was removed
    */},

    // edit (creates \ edit file) [in: <name>:String, <data>:String (optional). out: <file contents>:String or false:<bool>]
    edit: function(name, data)
    {/*
        Will either create a new file named <name> inside current directory, or edit it if already exists.
        The data parameter is optional; If no data is passed, the method will only returned stored data without editing it.
        Stored data is returned anyways, even if file was modified.
        Reasons for failure: Malformed filename. (Cannot contain path delimiters)

        Example:
            fso.edit("a.txt", "Hello, world!"); // Will store the string 'Hello, world!' inside a.txt and return it.
            fso.edit("a.txt"); // Will return 'Hello, world!'
    */},

    // del (removes files) [in: name<String>. out: <bool for success or not>:Boolean]
    del: function(name)
    {/*
        Will remove file from current directory permanently.
        Reasons for failure: Returns false if file doesn't exist or name is malformed.

        Example:
            fso.edit("a.txt", "Hello, world");
            fso.del("a.txt"); // Returns true
            fso.del("a.txt"); // Returns false, file does not exist
    */},

    // move (move files) [in: <absolute path of original file>:String, <path of destination>:String. out: <bool for success or not>:Boolean]
    move: function(pathIn, pathOut)
    {/*
        Will move a file from one location to another.
        NOTE: Both paths MUST BE ABSOLUTE (look above what an absolute path is) and contain filename as well (i.e. ./a/file.txt).
        Reasons for failure: Either the original file does not exist, or the destination path is invalid.

        Example:
            fso.move("./a.txt", "./b/c.txt"); // Will move file a.txt from root into dir ./b and rename it to c.txt
    */},

    // format (restore whole file system to default) [in: nothing. out: <bool for success or not>:Boolean]
    format: function() {/*
        Nothing much to explain. Restores filesystem to default, removes all files and dirs and leaves only the root directory.

        Example:
            fso.format();
    */},

    // ver (returns current fsjs version) [in: nothing. out: fsjs version]
    ver: function() {/*
        Returns current fsjs version.

        Example:
            fso.ver();
    */},

    // toString() - if object is being used as a string, it returns the current path. Acts like fso.cd();
    toString: function() {}

};

```

### The FS Module

The **FS** module acts as the interface between the FSO objects, used by the user, to the raw data eventually saved inside the localStorage. One could refer to it as a kind of a DAL entity.

An end user who do not wish to modify the library, should not be interacting with the **FS** module **at all**. If you want to study its operation, you are more than welcome to explore the fs.js source file (which has full commentary).

The only thing I will describe over here is how to customize its configuration:

*FS._config* contains all the configuration used by the system. Do remember that changing the configuration might cause incompatibility with previously saved data.

Here's a full description of the *FS._config* structure:

```Javascript

_config: {
        // Path delimiters
        delims: {
            path: "/", // Stands for the delimiter used to distinguish between path parts (DIR A / DIR B)
            root: ".", // Stands for the root symbol. If a path part equals to this, it is considered a root reference.
            up: ".." // Stands for the up one level symbol. If a path part equals to this, it is considered an up level reference.
        },
        // Type flags for file tree nodes
        types: {
            dir: "dir", // All fsjso containing the type string stored in DIR will be flagged as dirs
            file: "file" // All fsjso containing the type string stored in FILE will be flagged as files.
        },
        format: {contents: []}, // Default root. The object contained within this property will be the default filetree when formatting the system.
        prefix: "fsjs", // The prefix used when storing data inside the localStorage
        ver: "0.1" // Current fsjs version. If you're branching for redestribution, please change it to identify that your code is a branch and not master.
    },

```

## Examples

There are three examples within the examples subdir:

* [simple.html](examples/simple.html) - Contains a simple script performing basic actions.
* [fsjs-dos.html](examples/fsjs-dos.html) - Contains a "dos like" environment to try different fsjs commands.
* [browser.html](examples/browser.html) - Contains a browser-like visual file listing and creation.

## Finally.

I hope you'll find this library useful, and am looking forward to see what uses you're going to make of it.

Fell free to contact me if you find any bugs, have any complaints, suggestions, ideas, questions or just wanna say "nice job bro".

Roy Sommer
