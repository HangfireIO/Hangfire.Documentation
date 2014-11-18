Processing jobs in a web application
=====================================

Ability to process background jobs directly in web applications is a primary goal of Hangfire. No external application like Windows Service or console application is required for running background jobs, however you will be able to change your decision later if you really need it. So, you can postpone architecture decisions that complicate things.

Since Hangfire does not have any specific dependencies and does not depend on ``System.Web``, it can be used together with any web framework for .NET:

* ASP.NET WebForms
* ASP.NET MVC
* ASP.NET WebApi
* ASP.NET vNext (through the ``app.UseOwin`` method)
* Other OWIN-based web frameworks (`Nancy <http://nancyfx.org/>`_, `FubuMVC <http://mvc.fubu-project.org/>`_, `Simple.Web <https://github.com/markrendle/Simple.Web>`_)
* Other non-OWIN based web frameworks (`ServiceStack <https://servicestack.net/>`_)

Using ``BackgroundJobServer`` class
------------------------------------

The basic way (but not the simplest -- see the next section) to start using Hangfire in a web framework is to use host-agnostic ``BackgroundJobServer`` class that was described in the :doc:`previous chapter <processing-background-jobs>` and call its ``Start`` and ``Dispose`` method in corresponding places.

.. note::

   In some web application frameworks it may be unclear when to call the ``Dispose`` method. If it is really impossible, you can omit this call as :doc:`described here <processing-background-jobs>` (but you'll loose the *graceful shutdown* feature).

For example, in ASP.NET applications the best place for start/dispose method invocations is the ``global.asax.cs`` file:

.. code-block:: c#

   using System;
   using System.Web;
   using Hangfire;

   namespace WebApplication1
   {
       public class Global : HttpApplication
       {
           private BackgroundJobServer _backgroundJobServer;

           protected void Application_Start(object sender, EventArgs e)
           {
               // JobStorage.Current = new ...;
           
               _backgroundJobServer = new BackgroundJobServer();
               _backgroundJobServer.Start();
           }

           protected void Application_End(object sender, EventArgs e)
           {
               _backgroundJobServer.Dispose();
           }
       }
   }

Using OWIN extension methods
-----------------------------

Hangfire also provides a dashboard that is implemented on top of OWIN pipeline to process requests. If you have simple set-up and want to keep Hangfire initialization logic in one place, consider using Hangfire's :doc:`extension methods for OWIN <../getting-started/owin-bootstrapper>`'s ``IAppBuilder`` interface:

.. code-block:: c#

   app.UseHangfire(config =>
   {
       /* other configuration options */
       config.UseServer();
   });

This line creates a new instance of the ``BackgroundJobServer`` class automatically, calls the ``Start`` method and registers method ``Stop`` invocation on application shutdown. The latter is implemented using a ``CancellationToken`` instance stored in the ``host.OnAppDisposing`` environment key.

.. warning::

   If you are using OWIN extension methods for ASP.NET application hosted in IIS, ensure you have ``Microsoft.Owin.Host.SystemWeb`` package installed. Otherwise some features like `graceful shutdown <processing-background-jobs>`_ feature will not work for you.
   
   If you installed Hangfire through the ``Hangfire`` package, this dependency is already installed.
