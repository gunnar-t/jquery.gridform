jquery.gridform
===============
## Management summary
JQuery-Plugin for creating complex forms (table-based) with usage of bootstrap and (optional) Font-Awesome.


## Introduction
Why a new plugin for building html forms? Because I was tired of building (complex) forms by hand and needed
some lib for my projects that could handle the following:

 * Display a bunch of form elements in a (sometimes) complex grid
 * Have an "edit" and a "view" mode
 * Simple add validation or other event handler on form elements
 * Use the excellent bootstrap design and optional font awesome for "nicer" form ui
 * Have the ability to use elements spanning over some rows of the grid (rowspan and colspan)

Since I did not find a library doing all that in a kindly manner: I did it myself :)
The code was done in three days in my sparetime, so I am sorry for all the mess and all the bugs that are still in there.

## Example 

This is how a form could look like.
EXAMPLE IMAGE


## Usage

Download the project and add the following files to your HTML page or start with the **test.html** from the source.
Of course you can use all the third party stuff from CDNs, if you like.
If you want that, then you probably know what to do by yourself :)

```html
<!-- Design stuff -->
<link rel="stylesheet" type="text/css" href="css/reset.css"><!-- optional: for reseting browser defaults -->
<link rel="stylesheet" type="text/css" href="css/bootstrap.min.css">
<link rel="stylesheet" type="text/css" href="css/jquery.gridform.css">
<link rel="stylesheet" type="text/css" href="css/font-awesome.css"><!-- optional: for nicer checboxes and stuff -->
<!-- JS-Libs (best to include at the END ofr your HTML file !!-->
<script src="js/jquery.min.js"></script>
<script src="js/bootstrap.min.js"></script>
<script src="js/jquery.gridform.js"></script>
```


