Getting Started
================

.. admonition:: Under construction
   :class: warning

   Getting Started: framework, requirements (.net frameworks, persistent storage, json.net, application types, environments, ready for bad environments with at least once processing), packages (official, community, versioning, updating, highest dependency, NuGet version), basic usage (console app, global configuration (only once, startup, chain calls), client, server, comments). Strong naming via strongnamer.


Installation
-------------

Hangfire project consists of a couple of NuGet packages available on `NuGet Gallery site <https://www.nuget.org/packages?q=hangfire>`_. Here is the list of basic packages you should know about:

* `Hangfire <https://www.nuget.org/packages/Hangfire/>`_ – bootstrapper package that is intended to be installed **only** for ASP.NET applications that uses SQL Server as a job storage. It simply references to `Hangfire.Core <https://www.nuget.org/packages/Hangfire.Core/>`_, `Hangfire.SqlServer <https://www.nuget.org/packages/Hangfire.SqlServer/>`_ and `Microsoft.Owin.Host.SystemWeb <https://www.nuget.org/packages/Microsoft.Owin.Host.SystemWeb/>`_ packages.
* `Hangfire.Core <https://www.nuget.org/packages/Hangfire.Core/>`_ – basic package that contains all core components of Hangfire. It can be used in any project type, including ASP.NET application, Windows Service, Console, any OWIN-compatible web application, Azure Worker Role, etc.

.. admonition:: Install ``Microsoft.Owin.Host.SystemWeb`` package for ASP.NET + IIS
   :class: warning

   If you are using custom installation within a web application hosted in IIS, do not forget to install the `Microsoft.Owin.Host.SystemWeb <https://www.nuget.org/packages/Microsoft.Owin.Host.SystemWeb/>`_ package. Otherwise some features, like graceful shutdown may not work.

**Using Package Manager Console**

.. code-block:: c#

   PM> Install-Package Hangfire

**Using NuGet Package Manager**

Right-click on your project in Visual Studio and choose the ``Manage NuGet Packages`` menu item. Search for ``Hangfire`` and install the chosen package:

.. image:: package-manager.png
   :alt: NuGet Package Manager window

Configuration
--------------

Starting from version 1.4, ``GlobalConfiguration`` class is the preferred way to configure Hangfire. This is an entry point for a couple of methods, including ones from third-party storage implementations or other extensions. The usage is simple, just include ``Hangfire`` namespace in your application initialization class and discover extension methods for the ``GlobalConfiguration.Configuration`` property.

For example, in ASP.NET applications, you can place initialization logic to the ``Global.asax.cs`` file:

.. code-block:: c#

    using Hangfire;

    public class MvcApplication : System.Web.HttpApplication
    {
        protected void Application_Start()
        {
            // Storage is the only thing required for basic configuration.
            // Just discover what configuration options do you have.
            GlobalConfiguration.Configuration
                .UseSqlServerStorage("<name or connection string>");
                //.UseActivator(...)
                //.UseLogProvider(...)
        }
    }

For OWIN-based applications (ASP.NET MVC, Nancy, ServiceStack, FubuMVC, etc.), place the configuration lines to the OWIN Startup class.

.. code-block:: c#

    using Hangfire;

    [assembly: OwinStartup(typeof(Startup))]
    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            GlobalConfiguration.Configuration.UseSqlServerStorage("<name or connection string>");
        }
    }

.. toctree::
   :maxdepth: 1
   :hidden:

   aspnet-mvc-applications
   aspnet-core-applications
   console-applications
   windows-services