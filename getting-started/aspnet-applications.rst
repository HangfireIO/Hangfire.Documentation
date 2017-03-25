ASP.NET Applications
=========================

.. admonition:: Under construction
   :class: warning

   ASP.NET Applications: in-process processing (no windows services), dangers of running (timeouts, deployments, no problems, enhanced shutdown detection), installation (hangfire.core, hangfire.aspnet), startup configuration (storage, authorization), implementation (ismssender, iemailsender), next steps (always-running tip, basic logging).

You can put the background processing in an ASP.NET application without using additional processes like Windows Services. Hangfire's code is ready for unexpected process terminations, application pool recycles and restarts during the deployment process. Since persistent storages are used, you'll not lose any background job.

Installation
-------------

Before we start, we'll need a working ASP.NET application, you can use ASP.NET MVC or ASP.NET WebForms, the steps are the same. First of all, the following packages should be installed. There are a lot of ways to install NuGet packages, I'll show how to use the Package Manager Console window.

.. code-block:: powershell

   Install-Package Hangfire.Core
   Install-Package Hangfire.AspNet
   Install-Package Hangfire.SqlServer

Then, depending on the age of your application, we'll make some modification either to the ``Startup`` class, or the ``Global.asax.cs`` file. But not both at the same time, however nothing terrible will happen in this case, your configuration logic will be executed only once, first invocation wins.

Using Startup class
--------------------

If you have a more or less modern ASP.NET application, then you'd probably have the ``Startup.cs`` file. This case is the simplest case to bootstrap Hangfire and start using background processing. There are some extension methods and their overloads available for the ``IAppBuilder`` class.

All you need is to call them, to start using both Hangfire Dashboard and Hangfire Server.

.. code-block:: c#
   :emphasize-lines: 2,17-18

   // Startup.cs
   using Hangfire;

   public class Startup
   {
       private IEnumerable<IDisposable> GetHangfireServers(
           IGlobalConfiguration configuration)
       {
           configuration.UseSqlServerStorage(
               "Database=Hangfire.Sample; Integrated Security=True;");

           yield return new BackgroundJobServer();
       }

       public void Configuration(IAppBuilder app)
       {
           app.UseHangfireAspNet(GetHangfireServers);
           app.UseHangfireDashboard();
       }
   }

Using Global.asax.cs file
--------------------------

**Configured using the ``Startup`` class? Skip this section.** 

If you can't use the ``Startup`` class for a reason, just use the ``HangfireAspNet`` class and modify the ``Global.asax.cs`` file. You'll not have Hangfire Dashboard in this case, but at least you can start the background processing. 

If you want to install the dashboard also, please google how to add the ``Startup`` class to your project, and go to the previous section.

.. code-block:: c#
   :emphasize-lines: 2,20

   // Global.asax.cs
   using Hangfire;

   public class MvcApplication : System.Web.HttpApplication
   {
       private IEnumerable<IDisposable> GetHangfireServers(
           IGlobalConfiguration configuration)
       {
           configuration.UseSqlServerStorage(
               "Database=Hangfire.Sample; Integrated Security=True;");

           yield return new BackgroundJobServer();
       }

       protected void Application_Start()
       {
           AreaRegistration.RegisterAllAreas();
           RouteConfig.RegisterRoutes(RouteTable.Routes);

           HangfireAspNet.Use(GetHangfireServers);
       }
   }

Usage
------



Always running
---------------
