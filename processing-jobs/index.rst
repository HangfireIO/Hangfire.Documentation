Processing Jobs
================

.. admonition:: Under construction
   :class: warning

   Processing: server, BackgroundJobServer, BackgroundProcessingServer, basic usage, background threads, dedicated pool, background processes, basic architecture, server instances, starting background processing, filters and filter providers. Multiple servers, multiple apps.

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

Hangfire Server consist of different components that are doing different work: workers listen to queue and process jobs, recurring scheduler enqueues recurring jobs, schedule poller enqueues delayed jobs, expire manager removes obsolete jobs and keeps the storage as clean as possible, etc.

.. admonition:: You can turn off the processing
   :class: note

   If you don't want to process background jobs in a specific application instance, just don't create an instance of the ``BackgroundJobServer`` class.

The ``Dispose`` method is a **blocking** one, it waits until all the components prepare for shutdown (for example, workers will place back interrupted jobs to their queues). So, we can talk about graceful shutdown only after waiting for all the components.

Strictly saying, you aren't required to invoke the ``Dispose`` method. Hangfire can handle even unexpected process terminations, and will retry interrupted jobs automatically. However it is better to control the exit points in your methods by using :doc:`cancellation tokens <../background-methods/using-cancellation-tokens>`.

Running multiple server instances
----------------------------------

.. admonition:: Obsolete since 1.5
   :class: note
   
   You aren't required to have additional configuration to support multiple background processing servers in the same process since Hangfire 1.5, just skip the article. Server identifiers are now generated using GUIDs, so all the instance names are unique.

It is possible to run multiple server instances inside a process, machine, or on several machines at the same time. Each server use distributed locks to perform the coordination logic.

Each Hangfire Server has a unique identifier that consist of two parts to provide default values for the cases written above. The last part is a process id to handle multiple servers on the same machine. The former part is the *server name*, that defaults to a machine name, to handle uniqueness for different machines. Examples: ``server1:9853``, ``server1:4531``, ``server2:6742``.

Since the defaults values provide uniqueness only on a process level, you should handle it manually if you want to run different server instances inside the same process:

.. code-block:: c#

    var options = new BackgroundJobServerOptions
    {
        ServerName = String.Format(
            "{0}.{1}",
            Environment.MachineName,
            Guid.NewGuid().ToString())
    };

    var server = new BackgroundJobServer(options);

    // or
    
    app.UseHangfireServer(options);

Placing processing into another process
----------------------------------------

You may decide to move the processing to the different process from the main application. For example, your web application will only enqueue background jobs, leaving their performance to a Console application or Windows Service. First of all, let's overview the reasons for such decision.

Well scenarios
~~~~~~~~~~~~~~~~

* Your background processing consumes **too much CPU or other resources**, and this decreases main application's performance. So you want to use separate machine for processing background jobs.
* You have long-running jobs that **are constantly aborted** (retrying, aborted, retried again and so on) due to regular shutdowns of the main application. So you want to use separate process with increased lifetime (and you can't use :doc:`always running mode <../deployment-to-production/making-aspnet-app-always-running>` for your web application).
* *Do you have other suggestions? Please post them in the comment form below*.

You can stop processing background jobs in your main application by simply removing the instantiation of the ``BackgroundJobServer`` class (if you create it manually) or removing an invocation of the ``UseServer`` method from your OWIN configuration class.

After accomplishing the first step, you need to enable processing in another process, here are some guides:

* :doc:`Using Console applications <processing-jobs-in-console-app>`
* :doc:`Using Windows Services <processing-jobs-in-windows-service>`

.. admonition:: Same storage requires the same code base
   :class: note

   Ensure that all of your Client/Servers use **the same job storage** and **have the same code base**. If client enqueues a job based on the ``SomeClass`` that is absent in server's code, the latter will simply throw a performance exception.

If this is a problem, your client may have references only to interfaces, whereas server provide implementations (please see the :doc:`../background-methods/using-ioc-containers` chapter).

Doubtful scenarios
~~~~~~~~~~~~~~~~~~~~

* You don't want to consume additional Thread Pool threads with background processing -- Hangfire Server uses **custom, separate and limited thread pool**.
* You are using Web Farm or Web Garden and don't want to face with synchronization issues -- Hangfire Server is **Web Garden/Web Farm friendly** by default.

.. toctree::
   :maxdepth: 1
   :hidden:

   processing-lifetime
   processing-flow
   enqueued-processing
   scheduled-processing
   recurring-processing
   retries-exceptions
   extensibility