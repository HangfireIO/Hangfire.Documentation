Using Batches
==============

.. admonition:: Pro Only
   :class: note

   This feature is a part of `Hangfire Pro <https://www.hangfire.io/pro/>`_ package set

Batches allow you to create a bunch of background jobs *atomically*. This means that if there was an exception during the creation of background jobs, none of them will be processed. Consider you want to send 1000 emails to your clients, and they really want to receive these emails. Here is the old way:

.. code-block:: c#

   for (var i = 0; i < 1000; i++)
   {
       BackgroundJob.Enqueue(() => SendEmail(i));
       // What to do on exception?
   }

But what if storage become unavailable on ``i == 500``? 500 emails may be already sent, because worker threads will pick up and process jobs once they created. If you re-execute this code, some of your clients may receive annoying duplicates. So if you want to handle this correctly, you should write more code to track what emails were sent. 

But here is a much simpler method:

.. code-block:: c#

   BatchJob.StartNew(x =>
   {
       for (var i = 0; i < 1000; i++)
       {
           x.Enqueue(() => SendEmail(i));
       }
   });

In case of exception, you may show an error to a user, and simply ask to retry her action after some minutes. No other code required!

Installation
-------------

Batches are available in the `Hangfire.Pro <https://nuget.hangfire.io/feeds/hangfire-pro/Hangfire.Pro/>`_ package, and you can install it using NuGet Package Manager Console window as usually:

.. code-block:: powershell

   PM> Install-Package Hangfire.Pro

Batches require to add some additional job filters, some new pages to the Dashboard, and some new navigation menu items. But thanks to the new ``GlobalConfiguration`` class, it is now as simple as a one method call:

.. code-block:: c#

   GlobalConfiguration.Configuration.UseBatches();

.. admonition:: Limited storage support
   :class: warning

   Only **Hangfire.SqlServer** and **Hangfire.Pro.Redis** job storage implementations are currently supported. There is nothing special for batches, but some new storage methods should be implemented.

Configuration
--------------

The default batch job expiration/retention time if the batch succeeds is 7 days.

.. code-block:: c#
    
    var defaultBatchJobRetentionPeriod = new TimeSpan(2, 0, 0, 0); //2 day retention
    Hangfire.GlobalConfiguration.Configuration.UseBatches(defaultBatchJobRetentionPeriod);


Chaining Batches
-----------------

Continuations allow you to chain multiple batches together. They will be executed once *all background jobs* of a parent batch finished. Consider the previous example where you have 1000 emails to send. If you want to make final action after sending, just add a continuation:

.. code-block:: c#

   var id1 = BatchJob.StartNew(/* for (var i = 0; i < 1000... */);
   var id2 = BatchJob.ContinueWith(id1, x => 
   {
       x.Enqueue(() => MarkCampaignFinished());
       x.Enqueue(() => NotifyAdministrator());
   });

So batches and batch continuations allow you to define workflows and configure what actions will be executed in parallel. This is very useful for heavy computational methods as they can be distributed to a diffirent machines.

Complex Workflows
------------------

Create action does not restrict you to create jobs only in *Enqueued* state. You can schedule jobs to execute later, add continuations, add continuations to continuations, etc..

.. code-block:: c#

   var batchId = BatchJob.StartNew(x =>
   {
       x.Enqueue(() => Console.Write("1a... "));
       var id1 = x.Schedule(() => Console.Write("1b... "), TimeSpan.FromSeconds(1));
       var id2 = x.ContinueWith(id1, () => Console.Write("2... "));
       x.ContinueWith(id2, () => Console.Write("3... "));
   });
   
   BatchJob.ContinueWith(batchId, x =>
   {
       x.Enqueue(() => Console.WriteLine("4..."));
   });
