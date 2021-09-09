Processing background jobs
===========================

*Hangfire Server* part is responsible for background job processing. The Server does not depend on ASP.NET and can be started anywhere, from a console application to Microsoft Azure Worker Role. Single API for all applications is exposed through the ``BackgroundJobServer`` class:

.. code-block:: c#

   // Create an instance of Hangfire Server and start it.
   // Please look at ctor overrides for advanced options like 
   // explicit job storage instance.
   var server = new BackgroundJobServer(); 
   
   // Wait for graceful server shutdown.
   server.Dispose();

.. admonition:: Always dispose your background server
   :class: warning

   Call the ``Dispose`` method whenever possible to have graceful shutdown features working.

Hangfire Server consists of different components that are doing different work: workers listen to queue and process jobs, recurring scheduler enqueues recurring jobs, schedule poller enqueues delayed jobs, expire manager removes obsolete jobs and keeps the storage as clean as possible, etc.

.. admonition:: You can turn off the processing
   :class: note

   If you don't want to process background jobs in a specific application instance, just don't create an instance of the ``BackgroundJobServer`` class.

The ``Dispose`` method is a **blocking** one, it waits until all the components prepare for shutdown (for example, workers will place back interrupted jobs to their queues). So, we can talk about graceful shutdown only after waiting for all the components.

Strictly saying, you aren't required to invoke the ``Dispose`` method. Hangfire can handle even unexpected process terminations, and will retry interrupted jobs automatically. However it is better to control the exit points in your methods by using :doc:`cancellation tokens <../background-methods/using-cancellation-tokens>`.