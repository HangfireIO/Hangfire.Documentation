Background Methods
===================

Background jobs in Hangfire look like regular method calls. Most of its interfaces are using `expression trees <https://docs.microsoft.com/dotnet/csharp/programming-guide/concepts/expression-trees/>`_ to define what method should be called and with what arguments. And background jobs can use both instance and static method calls as in the following example.

.. code-block:: c#

   BackgroundJob.Enqueue<IEmailSender>(x => x.Send("hangfire@example.com"));
   BackgroundJob.Enqueue(() => Console.WriteLine("Hello, world!"));
   
These lines use *expression trees* -- not delegates like ``Action`` or ``Func<T>``. And unlike usual method invocations, they are supposed to be executed asynchronously and even outside of the current process. So the purpose of the method calls above is to collect and serialize the following information.

* Type name, including namespace and assembly.
* Method name and its parameter types.
* Argument values.

Serialization is performed by the `Newtonsoft.Json <https://www.newtonsoft.com/json>`_ package and resulting JSON, that looks like in the following snippet, is persisted in a storage making it available for other processes. As we can see everything is passed by value, so heavy data structures will also be serialized and consume a lot of bytes in our storage.

.. code-block:: json

   {"t":"System.Console, mscorlib","m":"WriteLine","p":["System.String"],"a":["Hello, world!"]}

.. admonition:: No other information is preserved
   :class: note

   Local variables, instance and static fields and other information isn't available in our background jobs.

Parameters
----------

It is also possible to preserve some context that will be associated with a background job by using *Job Parameters*. This feature is available from :doc:`Background Job Filters <../extensibility/using-job-filters>` and allow us to capture and restore some ambient information. Extension filters use job parameters to store additional details without any intervention to method call metadata.

For example, the `CaptureCultureAttribute <https://github.com/HangfireIO/Hangfire/blob/main/src/Hangfire.Core/CaptureCultureAttribute.cs>`_ filter uses job parameters to capture ``CurrentCulture`` and ``CurrentUICulture`` when creating a background job and restores it when it is about to be processed.

.. admonition:: Anyway, no other context data is preserved
   :class: note

   Scopes, globals, ``HttpContext`` instances and current user IDs aren't preserved automatically.

States
------

Each background job has a specific state associated with it at every moment in time that defines how and when it will be processed. There is a bunch of built-in states like ``Enqueued``, ``Scheduled``, ``Awaiting``, ``Processing``, ``Failed``, ``Succeeded`` and ``Deleted``, and custom states can be implemented as well.

During background processing, background jobs are moved from one state into another with executing some side effects. So Hangfire can be considered as a state machine for background jobs. Processed background jobs end in a *final state* (only ``Succeeded`` and ``Deleted`` built-in states, but not the ``Failed`` one) and will be expired automatically after 24 hours by default. 

Expiration time can be configured globally in the following way by calling the ``WithJobExpirationTimeout`` method. But we should ensure to call this method after the ``UseXXXStorage`` ones, otherwise we'll get a compilation error.

.. code-block:: c#

   GlobalConfiguration.Configuration
       .UseXXXStorage(/* ... */)
       .WithJobExpirationTimeout(TimeSpan.FromHours(6));

.. toctree::
   :maxdepth: 1
   :hidden:

   calling-methods-in-background
   calling-methods-with-delay
   performing-recurrent-tasks
   passing-arguments
   passing-dependencies
   using-ioc-containers
   using-cancellation-tokens
   writing-unit-tests
   using-batches