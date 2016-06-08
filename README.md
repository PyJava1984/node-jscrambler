# JScrambler Client for Node.js

- [RC configuration](#rc-configuration)
- [CLI](#cli)
  - [Required Fields](#required-fields)
  - [Output to a single file](#output-to-a-single-file)
  - [Output multiple files to a directory](#output-multiple-files-to-a-directory)
  - [Using minimatch](#using-minimatch)
  - [Using configuration file](#using-configuration-file)
- [API](#api)
  - [Upload/download example](#uploaddownload-example)
- [JScrambler Options](#jscrambler-options)
  - [asserts_elimination](#asserts_elimination)
  - [browser_os_lock](#browser_os_lock)
  - [constant_folding](#constant_folding)
  - [dead_code](#dead_code)
  - [dead_code_elimination](#dead_code_elimination)
  - [debugging_code_elimination](#debugging_code_elimination)
  - [dictionary_compression](#dictionary_compression)
  - [domain_lock](#domain_lock)
  - [domain_lock_warning_function](#domain_lock_warning_function)
  - [dot_notation_elimination](#dot_notation_elimination)
  - [exceptions_list](#exceptions_list)
  - [expiration_date](#expiration_date)
  - [expiration_date_warning_function](#expiration_date_warning_function)
  - [function_outlining](#function_outlining)
  - [function_reorder](#function_reorder)
  - [ignore_files](#ignore_files)
  - [literal_hooking](#literal_hooking)
  - [duplicate_literals](#duplicate_literals)
  - [member_enumeration](#member_enumeration)
  - [mode](#mode)
  - [name_prefix](#name_prefix)
  - [rename_all](#rename_all)
  - [rename_local](#rename_local)
  - [self_defending](#self_defending)
  - [string_splitting](#string_splitting)
  - [whitespace](#whitespace)

## RC configuration
You may put your access and secret keys into a config file if found in [these directories](https://github.com/dominictarr/rc#standards). Besides simplifying the command entry, this has the added benefit of not logging your JScrambler credentials.

Here's an example of what your `.jscramblerrc` file should look like:

```javascript
{
  "keys": {
    "accessKey": "XXXXXX",
    "secretKey": "XXXXXX"
  },
  "params": {
    "self_defending": "%DEFAULT%"
  }
}
```
Replace the `XXXXXX` fields with your values of course. :)

## CLI
```bash
npm install -g jscrambler@0
```
    Usage: jscrambler [source files] [options]

    Options:

      --help
      -V, --version
      -c, --config [config]
      -o, --output [output]
      -a, --access-key <accessKey>
      -s, --secret-key <secretKey>
      -h, --host [host]
      -p, --port [port]
      -v, --api-version [apiVersion]
      --asserts-elimination [assertsElimination]
      --browser-os-lock [browserOsLock]
      --constant-folding
      --dead-code
      --dead-code-elimination
      --debugging-code-elimination [debuggingCodeElimination]
      --dictionary-compression
      --domain-lock [domainLock]
      --domain-lock-warning-function [domainLockWarningFunction]
      --dot-notation-elimination
      --exceptions-list [exceptionsList]
      --expiration-date [expirationDate]
      --expiration-date-warning-function [expirationDateWarningFunction]
      --function-outlining
      --function-reorder
      --ignore-files [ignoreFiles]
      --literal-hooking [literalHooking]
      --literal-duplicates
      --member-enumeration
      --mode [mode]
      --name-prefix [namePrefix]
      --rename-all
      --rename-local
      --self-defending
      --string-splitting [stringSplitting]
      --whitespace


### Required Fields
When making API requests you must pass valid secret and access keys, through the command line or by having a `.jscramblerrc` file. These keys are each 40 characters long, alpha numeric strings, and uppercase. You can find them in your jscramber web dashboard under `My Account > Api access`. In the examples these are shortened to `XXXX` for the sake of readability.

### Output to a single file
```bash
jscrambler input.js -a XXXX -s XXXX > output.js
```

### Output multiple files to a directory
```bash
jscrambler input1.js input2.js -o dest/ -a XXXX -s XXXX
```

### Using minimatch
```bash
jscrambler "lib/**/*.js" -o dest/ -a XXXX -s XXXX
```

### Using configuration file
```bash
jscrambler input.js -s XXXX -a XXXX -c ./config.json > output.js
```
where `config.json` is an object optionally containing any of the JScrambler options listed [here](#jscrambler-options), using the structure described [in the RC configuration](#rc-config).


## API
```bash
npm install jscrambler
```
### Upload/download example
```js
var fs = require('fs-extra');
var jScrambler = require('jscrambler');

var client = new jScrambler.Client({
  keys: {
    accessKey: '', // not needed if you have it on your `.jscramblerrc`
    secretKey: '' // not needed if you have it on your `.jscramblerrc`
  }
});

jScrambler
  .uploadCode(client, {
    files: ['index.js'],
    // Node.js obfuscation settings
    rename_local: '%DEFAULT%',
    whitespace: '%DEFAULT%',
    literal_hooking: '%DEFAULT%',
    dead_code: '%DEFAULT%',
    dot_notation_elimination: '%DEFAULT%',
    dead_code_elimination: '%DEFAULT%',
    constant_folding: '%DEFAULT%',
    literal_duplicates: '%DEFAULT%',
    function_outlining: '%DEFAULT%',
    string_splitting:'%DEFAULT%'
  })
  .then(function (res) {
    return jScrambler.downloadCode(client, res.id);
  })
  .then(function (res) {
    return fs.writeFileSync('dist.zip', res);
  })
  .catch(function (error) {
    console.log(error);
  });
```

## JScrambler Options

The following options are passed to the JScrambler services through the CLI config file or some API methods. More information about them can be found [here](https://jscrambler.com/en/help/webapi/documentation).

### asserts_elimination
Type: `String`

`name1;name2;...` - assert function names

Remove function definitions and function calls with a given name.

### browser_os_lock
Type: `String`

Locks a JavaScript application to run only on a specific Browser or Operating System.

available values:

* `firefox`
* `chrome`
* `iexplorer`
* `linux`
* `windows`
* `mac_os`
* `tizen`
* `android`
* `ios`


### constant_folding
Type: `String`

`%DEFAULT%` - enable constant folding

Simplifies constant expressions at compile-time to make your code faster at run-time.

### cwd
Type: `String`

Sets the current working directory of JScrambler. Use this to compile a project which is located under another folder.

### dead_code
Type: `String`

`%DEFAULT%` - enable dead code

Randomly injects dead code into the source code.

### dead_code_elimination
Type: `String`

`%DEFAULT%` - enable dead code elimination

Removes dead code and void code from your JavaScript.

### debugging_code_elimination
Type: `String`

`name1;name2;...` - debugging code names

Removes statements and public variable declarations used to control the output of debugging messages that help you debug your code.

### dictionary_compression
Type: `String`

`%DEFAULT%` - enable dictionary compression

Dictionary compression to shrink even more your source code.

### domain_lock
Type: `String`

`domain1;domain2;...` - your domains

Locks your project to a list of domains you specify.

### domain_lock_warning_function
Type: `String`

`name` - your domain lock warning function.

Executes a function whenever there's a domain lock violation.

### dot_notation_elimination
Type: `String`

`%DEFAULT%` - enable dot notation elimination

Transforms dot notation to subscript notation.

### exceptions_list
Type: `String`

`name;name1;name2;...` - list of exceptions that will never be replaced or used to create new declarations

There are some names that should never be replaced or reused to create new declarations e.g. document, toUpperCase. Public declarations existing in more than one source file should not be replaced if you submit only a part of the project where they appear. Therefore a list of irreplaceable names and the logic to make distinction between public and local names already exists on JScrambler to avoid touching those names. Use this parameter to add your own exceptions.

### expiration_date
Type: `String`

`date` - date format YYYY/MM/DD

Sets your JavaScript to expire after a date of your choosing.

### expiration_date_warning_function
Type: `String`

`name` - your expiration date warning function.

Executes a function whenever there's an expiration date violation.

### function_outlining
Type: `String`

`%DEFAULT%` - enable function outlining

Turns statements into new function declarations.

### function_reorder
Type: `String`

`%DEFAULT%` - enable function reordering

Randomly reorders your source code's function declarations.

### ignore_files
Type: `String`

`filename;filename1` - List of files (relative paths) to be ignored

Define a list of files (relative paths) that JScrambler must ignore.

### literal_hooking
Type: `String`

`min;max[;percentage]` - min and max predicates in ternary operator and percentage chance of replacement

Replaces literals by a randomly sized chain of ternary operators. You may configure the minimum and maximum number of predicates per literal, as the occurrence probability of the transformation. This allows you to control how big the obfuscated JavaScript grows and the potency of the transformation.

### duplicate_literals
Type: `String`

`%DEFAULT%` - enable duplicate literals

Replaces literal duplicates by a symbol.

### member_enumeration
Type: `String`

`%DEFAULT%` - enable member enumeration

Replaces Browser and HTML DOM objects by a member enumeration.

### mode
Type: `String`

* `starter` - Standard protection and optimization behavior. Enough for most * JavaScript applications
* `mobile` - Transformations are applied having into account the limitations and needs of mobile devices
* `html5` - Protects your HTML5 and Web Gaming applications by targeting the new HTML5 features
* `nodejs` - Protects your Node.js application

### name_prefix
Type: `String`

Set a prefix to be appended to the new names generated by JScrambler.

### rename_all
Type: `String`

`%DEFAULT%` - enable rename all

Renames all identifiers found at your source code. By default, there is a list of JavaScript and HTML DOM names that will not be replaced. If you need to add additional exceptions use the exceptions_list parameter.

### rename_local
Type: `String`

`%DEFAULT%` - enable rename local

Renames local names only. The best way to replace names without worrying about name dependencies.


### self_defending
Type: `String`

`%DEFAULT%` - enable self defending

Obfuscates functions and objects concealing their logic and thwarting code tampering attempts by using anti-tampering and anti-debugging techniques. Attempts to tamper the code will break its functionality and using JavaScript debuggers will trigger defenses to thwart analysis.


### string_splitting
Type: `String`

`occurrences[;concatenation]`

occurrences - Percentage of occurrences. Accepted values between 0.01 and 1.
concatenation - Percentage of concatenation occurrences. Accepted values between 0 and 1 (0 means chunks of a single character and 1 the whole string).

### whitespace
Type: `String`

`%DEFAULT%` - enable whitespace

Shrink the size of your JavaScript removing unnecessary whitespaces and newlines from the source code.
