
Configuring Job Queues
======================

Hangfire can process multiple queues. If you want to prioritize your jobs or split the processing across your servers (some processes the archive queue, others – the images queue, etc), you can tell Hangfire about your decisions.

To place a job into a different queue, use the QueueAttribute class on your method:

.. code-block:: c#

   [Queue("critical")]
   public void SomeMethod() { }

   BackgroundJob.Enqueue(() => SomeMethod());
  
.. admonition:: Queue name argument formatting 
   :class: warning

   The Queue name argument must consist of lowercase letters, digits, underscore, and dash (since 1.7.6) characters only.
  
To start to process multiple queues, you need to update your ``BackgroundJobServer`` configuration.

.. code-block:: c#

   var options = new BackgroundJobServerOptions 
   {
       Queues = new[] { "critical", "default" }
   };
   
   app.UseHangfireServer(options);
   // or
   using (new BackgroundJobServer(options)) { /* ... */ }

The order is important, workers will fetch jobs from the critical queue first, and then from the default queue.
