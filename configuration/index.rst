Configuration
==============

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

For other applications, place it somewhere **before** calling other Hangfire methods.

.. toctree::
   :maxdepth: 1

   using-dashboard
   using-sql-server
   using-sql-server-with-msmq
   using-redis
   configuring-logging