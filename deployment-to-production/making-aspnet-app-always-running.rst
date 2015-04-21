Making ASP.NET application always running
==========================================

By default, Hangfire Server instance in a web application will not be started until the first user hits your site. Even more, there are some events that will bring your web application down after some time (I'm talking about Idle Timeout and different app pool recycling events). In these cases your :doc:`recurring tasks <../background-methods/performing-recurrent-tasks>` and :doc:`delayed jobs <../background-methods/calling-methods-with-delay>` will not be enqueued, and :doc:`enqueued jobs <../background-methods/calling-methods-in-background>` will not be processed. 

This is particulary true for smaller sites, as there may be long periods of user inactivity. But if you are running critical jobs, you should ensure that your Hangfire Server instance is always running to guarantee the in-time background job processing.

On-Premise applications
------------------------

For web applications running on servers under your control, either physical or virtual, you can use the auto-start feature of IIS ≥ 7.5 shipped with Windows Server ≥ 2008 R2. Full setup requires the following steps to be done:

1. Enable automatic start-up for Windows Process Activation (WAS) and World Wide Web Publishing (W3SVC) services (enabled by default).
2. `Configure Automatic Startup <http://technet.microsoft.com/en-us/library/cc772112(v=ws.10).aspx>`_ for an Application pool (enabled by default).
3. Enable Always Running Mode for Application pool and configure Auto-start feature as written below.

Creating classes
~~~~~~~~~~~~~~~~~

First, you'll need a special class that implements the ``IProcessHostPreloadClient`` interface. It will be called automatically by Windows Process Activation service during its start-up and after each Application pool recycle.

.. code-block:: c#

   public class ApplicationPreload : System.Web.Hosting.IProcessHostPreloadClient
   {
       public void Preload(string[] parameters)
       {
           HangfireBootstrapper.Instance.Start();
       }
   }

Then, update your ``global.asax.cs`` file as described below. :doc:`It is important <../background-processing/processing-background-jobs>` to call the ``Stop`` method of the ``BackgroundJobServer`` class instance, and it is also important to start Hangfire server in environments that don't have auto-start feature enabled (for example, on development machines) also.

.. code-block:: c#

    public class Global : HttpApplication
    {
        protected void Application_Start(object sender, EventArgs e)
        {
            HangfireBootstrapper.Instance.Start();
        }
 
        protected void Application_End(object sender, EventArgs e)
        {
            HangfireBootstrapper.Instance.Stop();
        }
    }

Then, create the ``HangfireBootstrapper`` class as follows. Since both ``Application_Start`` and ``Preload`` methods will be called in environments with auto-start enabled, we need to ensure that the initialization logic will be called exactly once.

.. code-block:: c#

    public class HangfireBootstrapper : IRegisteredObject
    {
        public static readonly HangfireBootstrapper Instance = new HangfireBootstrapper();

        private readonly object _lockObject = new object();
        private bool _started;

        private BackgroundJobServer _backgroundJobServer;
        
        public void Start()
        {
            lock (_lockObject)
            {
                if (_started) return;
                _started = true;

                HostingEnvironment.RegisterObject(this);

                GlobalConfiguration.Configuration
                    .UseSqlServerStorage("connection string");
                    // Specify other options here

                _backgroundJobServer = new BackgroundJobServer();
            }
        }

        public void Stop()
        {
            lock (_lockObject)
            {
                if (_backgroundJobServer != null)
                {
                    _backgroundJobServer.Dispose();
                }

                HostingEnvironment.UnregisterObject(this);
            }
        }

        void IRegisteredObject.Stop(bool immediate)
        {
            Stop();
        }
    }

And optionally, if you want to map Hangfire Dashboard UI, create an OWIN startup class:

.. code-block:: c#

   public class Startup
   {
       public void Configuration(IAppBuilder app)
       {
           var authorizationFilters = new[]
           {
               new LocalRequestsOnlyAuthorizationFilter()
           };

           app.MapHangfireDashboard("/hangfire", authorizationFilters);
       }
   }

Enabling Service Auto-start
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

After creating above classes, you should edit the global ``applicationHost.config`` file (``%WINDIR%\System32\inetsrv\config\applicationHost.config``). First, you need to change the start mode of your application pool to ``AlwaysRunning``, and then enable Service AutoStart Providers.

.. admonition:: Save only after all modifications
   :class: note

   After making these changes, the corresponding application pool will be restarted automatically. Make sure to save changes **only after** modifying all elements.

.. code-block:: xml

   <applicationPools>
       <add name="MyAppWorkerProcess" managedRuntimeVersion="v4.0" startMode="AlwaysRunning" />
   </applicationPools>

   <!-- ... -->

   <sites>
       <site name="MySite" id="1">
           <application path="/" serviceAutoStartEnabled="true" 
                                 serviceAutoStartProvider="ApplicationPreload" />
       </site>
   </sites>

   <!-- Just AFTER closing the `sites` element AND AFTER `webLimits` tag -->
   <serviceAutoStartProviders>
       <add name="ApplicationPreload" type="WebApplication1.ApplicationPreload, WebApplication1" />
   </serviceAutoStartProviders>

 
There is no need to set IdleTimeout to zero -- when Application pool's start mode is set to ``AlwaysRunning``, idle timeout does not working anymore.

Ensuring auto-start feature is working
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. admonition:: If something went wrong...
   :class: note

   If your app won't load after these changes made, check your Windows Event Log by opening **Control Panel → Administrative Tools → Event Viewer**. Then open *Windows Logs → Application* and look for a recent error records.

The simplest method - recycle your Application pool, wait for 5 minutes, then go to the Hangfire Dashboard UI and check that current Hangfire Server instance was started 5 minutes ago. If you have problems -- don't hesitate to ask them on `forum <http://discuss.hangfire.io>`_.

Azure web applications
-----------------------

Enabling always running feature for application hosted in Microsoft Azure is simpler a bit: just turn on the ``Always On`` switch on the Configuration page and save settings.

This setting does not work for free sites.

.. image:: always-on.png
   :alt: Always On switch

If nothing works for you…
--------------------------

… because you are using shared hosting, free Azure web site or something else (btw, can you tell me your configuration in this case?), then you can use the following ways to ensure that Hangfire Server is always running:

1. Use :doc:`separate process <../background-processing/placing-processing-into-another-process>` to handle background jobs either on the same, or dedicated host.
2. Make HTTP requests to your web site on a recurring basis by external tool (for example, `Pingdom <https://www.pingdom.com/>`_).
3. *Do you know any other ways? Let me know!*
