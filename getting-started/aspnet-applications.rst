ASP.NET Applications
=========================

.. admonition:: Under construction
   :class: warning

   ASP.NET Applications: in-process processing (no windows services), dangers of running (timeouts, deployments, no problems, enhanced shutdown detection), installation (hangfire.core, hangfire.aspnet), startup configuration (storage, authorization), implementation (ismssender, iemailsender), next steps (always-running tip, basic logging).

.. code-block:: powershell

   Install-Package Hangfire.Core
   Install-Package Hangfire.AspNet
   Install-Package Hangfire.SqlServer

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

