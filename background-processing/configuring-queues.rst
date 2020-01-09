
Configuring Job Queues
======================

Hangfire can process multiple queues. If you want to prioritize your jobs, or split the processing across your servers (some processes for the archive queue, others for the images queue, etc), you can tell Hangfire about your decisions.

To place a job into a different queue, use the ``QueueAttribute`` class on your method:

.. code-block:: c#

   [Queue("alpha")]
   public void SomeMethod() { }

   BackgroundJob.Enqueue(() => SomeMethod());
  
.. admonition:: Queue name argument formatting 
   :class: warning

   The Queue name argument must consist of lowercase letters, digits, underscore, and dash (since 1.7.6) characters only.
  
To begin processing multiple queues, you need to update your ``BackgroundJobServer`` configuration.

.. code-block:: c#

   var options = new BackgroundJobServerOptions 
   {
       Queues = new[] { "alpha", "beta", "default" }
   };
   
   app.UseHangfireServer(options);
   // or
   using (new BackgroundJobServer(options)) { /* ... */ }
   
**Queues are run in alphabetical order.** In the above example, workers will fetch jobs from the ``alpha`` queue first, ``beta`` second, and then from the ``default`` queue.

ASP.NET Core
------------

For ASP.NET Core, define the queues array with ``services.AddHangfireServer`` in ``Startup.cs``:

.. code-block:: c#

   public void ConfigureServices(IServiceCollection services)
   {
       // Add the processing server as IHostedService
       services.AddHangfireServer(options =>
       {
           options.Queues = new[] { "alpha", "beta", "default" };
       });
   }
