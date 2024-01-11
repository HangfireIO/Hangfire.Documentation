# Hangfire Documentation

This repository contains [Sphinx-based](http://sphinx-doc.org) documentation for [Hangfire](https://www.hangfire.io). https://docs.hangfire.io

Contributing
-------------

### The Easy Way

Just click the `Edit on GitHub` button while observing a page with mistakes as shown below. GitHub will guide you to fork the repository. Please don't forget to create a pull request!

![Contributing via Documentation Site](https://raw.githubusercontent.com/HangfireIO/Hangfire.Documentation/main/contributing.png)

Documentation is automatically deployed to the site after each commit. For small changes just propose a pull request. Thanks to [Read the Docs](https://readthedocs.org) service for help!

### The Hard Way

#### Installing Sphinx

[Official installation guide](http://sphinx-doc.org/latest/install.html) describes all steps 
required to run Sphinx on Windows / Linux / Mac OS X.

#### Building

Clone the repository and run the following command:

```
make html
```

After building, generated `*.html` files will be available in the `_build` directory.

License
--------

[![Creative Commons License](https://i.creativecommons.org/l/by/4.0/88x31.png)](http://creativecommons.org/licenses/by/4.0/)

This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
