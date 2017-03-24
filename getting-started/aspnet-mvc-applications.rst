ASP.NET MVC Applications
=========================

.. admonition:: Under construction
   :class: warning

   ASP.NET Applications: in-process processing (no windows services), dangers of running (timeouts, deployments, no problems, enhanced shutdown detection), installation (hangfire.core, hangfire.aspnet), startup configuration (storage, authorization), implementation (ismssender, iemailsender), next steps (always-running tip, basic logging).

Hangfire also provides a dashboard that is implemented on top of OWIN pipeline to process requests. If you have simple set-up and want to keep Hangfire initialization logic in one place, consider using Hangfire's extension methods for OWIN's ``IAppBuilder`` interface:

.. admonition:: Install ``Microsoft.Owin.Host.SystemWeb`` for ASP.NET + IIS
   :class: warning

   If you are using OWIN extension methods for ASP.NET application hosted in IIS, ensure you have ``Microsoft.Owin.Host.SystemWeb`` package installed. Otherwise some features like `graceful shutdown <processing-background-jobs>`_ feature will not work for you.
   
   If you installed Hangfire through the ``Hangfire`` package, this dependency is already installed.

.. code-block:: c#

    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            app.UseHangfireServer();
        }
    }

This line creates a new instance of the ``BackgroundJobServer`` class automatically, calls the ``Start`` method and registers method ``Dispose`` invocation on application shutdown. The latter is implemented using a ``CancellationToken`` instance stored in the ``host.OnAppDisposing`` environment key.
