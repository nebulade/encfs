EncFS node module
=================


Introduction
------------

__!still under heavy development!__

This node module is a wrapper around the encfs deamon.
It relies on encfs being present on the system. If present, the module
works on Linux and MacOS.


Installation
------------

Simply via npm:

```
npm install encfs
```


Usage
-----

Create an encfs root, initialize and mount it:
```
var encfs = require('encfs');

encfs.create('./my_root_folder, './my_mount_point, 'mypassword', function (error, result) {
    var encfsRoot = result;

    console.log(encfsRoot);
});
```

If encfs.create() succeeds, it will pass a newly created instance of encfs.Root as the callback's result.

Using an instance of encfs.Root:
```
var encfs = require('encfs');
var root = new encfs.Root('./my_root_folder', './my_mount_point');

root.isMounted(function (error, result) {
    if (error) {
        console.error(error);
        return;
    }

    if (result) {
        console.log('Root is mounted');
    } else {
        console.log('Root is not mounted');
    }
});
```

Mount and unmount the Root:
```
root.mount('mypassword', function (error) {
    if (error)  {
        console.error(error);
        return;
    }

    console.log('Root is now mounted.');

    root.unmount(function (error) {
        if (error)  {
            console.error(error);
            return;
        }

        console.log('Root is now unmounted.');
    });
});
```
