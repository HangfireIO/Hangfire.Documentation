Enqueued State Processing
==========================

.. admonition:: Under construction
   :class: warning

   Enqueued processing: core, queues (not for different apps), queue order, queue priority, multiple queues, type activation and IoC container, worker count, worker process, requeue semantics, job scope, server filters, exception filters, canceling processing via filters, IDisposable handling, cancellation token and conditions, latency and duration, timeout for jobs, cancel processing, at least once processing, retries, poison messages, processing state, default activator. Clear queues, throttling, custom type activator.

Configuring the degree of parallelism
--------------------------------------

Background jobs are processed by a dedicated pool of worker threads that run inside Hangfire Server subsystem. When you start the background job server, it initializes the pool and starts the fixed amount of workers. You can specify their number by passing the value to the ``UseHangfireServer`` method.

.. code-block:: c#

   var options = new BackgroundJobServerOptions { WorkerCount = Environment.ProcessorCount * 5 };
   app.UseHangfireServer(options);
   
If you use Hangfire inside a Windows service or console app, just do the following:

.. code-block:: c#

    var options = new BackgroundJobServerOptions
    {
        // This is the default value
        WorkerCount = Environment.ProcessorCount * 5
    };

    var server = new BackgroundJobServer(options);

Worker pool uses dedicated threads to process jobs separately from requests to let you to process either CPU intensive or I/O intensive tasks as well and configure the degree of parallelism manually.


Configuring Job Queues
-----------------------

Hangfire can process multiple queues. If you want to prioritize your jobs or split the processing across your servers (some processes the archive queue, others – the images queue, etc), you can tell Hangfire about your decisions.

To place a job into a different queue, use the QueueAttribute class on your method:

.. code-block:: c#

   [Queue("critical")]
   public void SomeMethod() { }

   BackgroundJob.Enqueue(() => SomeMethod());
  
.. admonition:: Queue name argument formatting 
   :class: warning

   The Queue name argument must consist of lowercase letters, digits and underscore characters only.
  
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
