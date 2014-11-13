Passing arguments
==================

You can pass additional data to your background jobs as a regular method arguments. I'll write the following line once again (hope it hasn't bothered you):

.. code-block:: c#

   BackgroundJob.Enqueue(() => Console.WriteLine("Hello, {0}!", "world"));

As in a regular method call, these arguments will be available for the ``Console.WriteLine`` method during the performance of a background job. But since they are being marshaled through the process boundaries, they are being serialized.

Awesome `Newtonsoft.Json <http://james.newtonking.com/json>`_ package is being used to serialize arguments into JSON strings (since version ``1.1.0``). So you can use almost any type as a parameter type, including arrays, collections and custom objects. Please see `corresponding documentation <http://james.newtonking.com/json/help/index.html>`_ for the details.

.. note::

   You can not pass arguments to parameters by reference – ``ref`` and ``out`` keywords are **not supported**.

Since arguments are being serialized, consider their values carefully as they can blow up your job storage. Most of the time it is more efficient to store concrete values in an application database and pass identifiers only to your background jobs.

Remember that background jobs may be processed even after days or weeks since they were enqueued. If you use data that is subject to change in your arguments, it may become stale – database records may be deleted, text of an article may be changed, etc. Expect these changes and design background jobs according to this feature.
