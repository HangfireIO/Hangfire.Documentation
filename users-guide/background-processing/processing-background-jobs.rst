Processing background jobs
===========================

*Hangfire Server* part is responsible for background job processing. It is optional, and not being started automatically -- there is no magic, just additional lines of code.

The Server does not depend on ASP.NET and can be started anywhere, from a console application to Microsoft Azure Worker Role. Single API for all applications is being exposed with the ``BackgroundJobServer`` class:

.. code-block:: c#

   // Creating an instance with `JobStorage.Current` instance.
   // Please look at ctor overrides for advanced options like 
   // explicit job storage instance.
   var server = new BackgroundJobServer(); 

   // Starting to process background jobs.
   server.Start();

   // Stopping the processing gracefully.
   server.Stop(); // or server.Dispose();

Hangfire Server consist of different components that are doing different work: workers listen to queue and process jobs, recurring scheduler enqueues recurring jobs, schedule poller enqueues delayed jobs, expire manager removes obsolete jobs and keeps the storage as clean as possible, etc.

The ``Start`` method starts all of these components in separate threads in a **non-blocking manner**. This will require some additional blocking code in a console application, but it is more efficient for web applications.

.. note::

   If you don't want to process background jobs in a specific application instance, just don't create an instance of the ``BackgroundJobServer`` class or simply don't call the ``Start`` method in that instance.

The ``Stop`` method *tries* to perform graceful shutdown of all server components. Unlike the ``Start`` method, this method has **blocking behavior** -- the control is being returned to the caller only after all components were stopped.

Strictly saying, *you are not required* to invoke the ``Stop`` method. Hangfire can handle even unexpected process terminations almost fine, and will retry interrupted jobs automatically. However, if you are not calling the ``Stop`` method, some things like :doc:`cancellation tokens <../background-methods/using-cancellation-tokens>` or automatic job re-queueing on shutdown (instead of waiting for a job invisibility timeout) -- in other words graceful shutdown -- **will not work**.

.. note::

   Try to call the ``Stop`` method where possible to have graceful shutdown features working.